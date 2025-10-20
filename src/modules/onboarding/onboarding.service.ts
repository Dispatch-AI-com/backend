import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';

import { CompanyService } from '../company/company.service';
import { CreateCompanyDto } from '../company/dto/create-company.dto';
import { VerificationService } from '../verification/services/verification.service';
import { VerificationType } from '../verification/dto/verification.dto';
import { UserService } from '../user/user.service';
import {
  OnboardingAnswers,
  OnboardingSession,
  OnboardingSessionDocument,
} from './schema/onboarding-session.schema';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  private readonly AU_ADDR_REGEX =
    /^(?<street>[^,]+),\s*(?<suburb>[^,]+),\s*(?<state>[A-Z]{2,3})\s+(?<postcode>\d{4})$/;

  private readonly fieldValidators: Partial<
    Record<
      string,
      (
        this: OnboardingService,
        answer: string,
        update: UpdateQuery<OnboardingSessionDocument>,
      ) => void | Promise<void>
    >
  > = {
    'user.address.full': function (answer, update) {
      const match = this.AU_ADDR_REGEX.exec(answer.trim());
      if (!match?.groups) {
        throw new BadRequestException(
          'Unable to parse address; please check the format.',
        );
      }
      update.$set['answers.user.address.streetAddress'] =
        match.groups.street.trim();
      update.$set['answers.user.address.suburb'] = match.groups.suburb.trim();
      update.$set['answers.user.address.state'] = match.groups.state;
      update.$set['answers.user.address.postcode'] = match.groups.postcode;
      update.$set['answers.user.address.full'] = answer; // raw string
    },

    'user.greeting.type': function (answer, update) {
      const trimmedAnswer = answer.trim();
      if (
        !['Use Default Greeting', 'Create Custom Greeting'].includes(
          trimmedAnswer,
        )
      ) {
        throw new BadRequestException(
          'Invalid greeting type. Must be "Use Default Greeting" or "Create Custom Greeting".',
        );
      }
      update.$set['answers.user.greeting.type'] = trimmedAnswer;

      // Step skipping logic is handled in the main saveAnswer method
      // No need to set default greeting values - User schema already has defaults
    },

    'user.greeting.message': function (answer, update) {
      const trimmedAnswer = answer.trim();
      if (trimmedAnswer.length < 10 || trimmedAnswer.length > 500) {
        throw new BadRequestException(
          'Greeting message must be between 10 and 500 characters.',
        );
      }
      update.$set['answers.user.greeting.message'] = trimmedAnswer;
      update.$set['answers.user.greeting.isCustom'] = true;
    },
  };

  constructor(
    @InjectModel(OnboardingSession.name)
    private readonly sessionModel: Model<OnboardingSessionDocument>,
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
  ) {}

  /**
   * save answer of one step
   */
  async saveAnswer(
    userId: string,
    stepId: number,
    answer: string,
    field: string,
  ): Promise<{ success: boolean; currentStep: number }> {
    // Calculate next step - default is +1, but some fields may skip steps
    let nextStep = stepId + 1;

    // Special case: if user chooses default greeting, skip custom message step
    if (
      field === 'user.greeting.type' &&
      answer.trim() === 'Use Default Greeting'
    ) {
      nextStep = stepId + 2; // Skip step 5 (custom message input)
    }

    const update: UpdateQuery<OnboardingSessionDocument> = {
      $set: {
        currentStep: nextStep,
        status: 'in_progress',
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    };

    const validator = this.fieldValidators[field];
    if (validator) {
      await validator.call(this, answer, update);
    } else if (field.trim()) {
      update.$set[`answers.${field}`] = answer.trim();
    }

    await this.sessionModel.updateOne({ userId }, update, { upsert: true });

    // Handle direct user field updates (phone, position)
    if (
      field.startsWith('user.') &&
      !field.includes('address') &&
      !field.includes('greeting')
    ) {
      const [, key] = field.split('.');
      await this.userService.patch(userId, { [key]: answer.trim() });
    }

    // Handle address update immediately after parsing
    if (field === 'user.address.full') {
      const addressData = {
        unitAptPOBox: update.$set['answers.user.address.unitAptPOBox'] ?? '',
        streetAddress: update.$set['answers.user.address.streetAddress'],
        suburb: update.$set['answers.user.address.suburb'],
        state: update.$set['answers.user.address.state'],
        postcode: update.$set['answers.user.address.postcode'],
      };
      await this.userService.patch(userId, { address: addressData });
    }

    // Handle custom greeting message immediately
    if (field === 'user.greeting.message') {
      const greetingData = {
        message: answer.trim(),
        isCustom: true,
      };
      await this.userService.patch(userId, { greeting: greetingData });
    }

    return {
      success: true,
      currentStep: nextStep,
    };
  }

  /**
   * search current onboarding session of user
   */
  async getProgress(userId: string): Promise<{
    currentStep: number;
    answers: OnboardingAnswers;
    status: string;
  }> {
    const session = await this.sessionModel.findOne({ userId }).lean();

    if (!session) {
      return {
        currentStep: 1,
        answers: {},
        status: 'in_progress',
      };
    }

    return {
      currentStep: session.currentStep,
      answers: session.answers,
      status: session.status,
    };
  }

  /**
   * mark onboarding as complete
   */
  async completeSession(userId: string): Promise<{ success: boolean }> {
    const session = await this.sessionModel.findOne({ userId }).lean();
    if (!session) throw new NotFoundException('session not found');

    const userAns = session.answers.user;
    if (!userAns) {
      throw new BadRequestException('user answers not found in session');
    }

    // Address and greeting are now updated immediately in saveAnswer()
    // No need to update user data here anymore

    await this.sessionModel.updateOne(
      { userId },
      { status: 'completed', updatedAt: new Date() },
    );

    // Create verification record for the user
    try {
      await this.verificationService.updateVerification(userId, {
        type: VerificationType.BOTH,
        email: user.email,
        mobile: user.fullPhoneNumber || '',
        emailVerified: false,
        mobileVerified: false,
        marketingPromotions: false,
      });
    } catch (error) {
      // Log error but don't fail onboarding completion
      this.logger.error('Failed to create verification record:', error);
    }

    return { success: true };
  }

  /**
   * delete Onboarding Session of certain user
   */
  async deleteSession(userId: string): Promise<{ success: boolean }> {
    const result = await this.sessionModel.deleteOne({ userId });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User session not found: ${userId}`);
    }

    return { success: true };
  }

  /**
   * get all onboarding sessions
   */
  async getAllSessions(): Promise<OnboardingSession[]> {
    return this.sessionModel.find().select('-__v').lean().exec();
  }
}
