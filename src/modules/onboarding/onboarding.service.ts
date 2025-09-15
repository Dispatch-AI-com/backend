import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';

import { UserService } from '../user/user.service';
import {
  OnboardingAnswers,
  OnboardingSession,
  OnboardingSessionDocument,
} from './schema/onboarding-session.schema';

@Injectable()
export class OnboardingService {
  AU_ADDR_REGEX =
    /^(?<street>[^,]+),\s*(?<suburb>[^,]+),\s*(?<state>[A-Z]{2,3})\s+(?<postcode>\d{4})$/;

  fieldValidators: Partial<
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
  };

  constructor(
    @InjectModel(OnboardingSession.name)
    private readonly sessionModel: Model<OnboardingSessionDocument>,
    private readonly userService: UserService,
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
    const update: UpdateQuery<OnboardingSessionDocument> = {
      $set: {
        currentStep: stepId + 1,
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

    return {
      success: true,
      currentStep: stepId + 1,
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

    // Update user with collected information
    const updateData: {
      address?: {
        unitAptPOBox?: string;
        streetAddress: string;
        suburb: string;
        state: string;
        postcode: string;
      };
      greeting?: {
        message: string;
        isCustom: boolean;
      };
    } = {};

    if (userAns.address !== undefined) {
      updateData.address = {
        unitAptPOBox: userAns.address.unitAptPOBox ?? '',
        streetAddress: userAns.address.streetAddress,
        suburb: userAns.address.suburb,
        state: userAns.address.state,
        postcode: userAns.address.postcode,
      };
    }

    if (userAns.greeting !== undefined) {
      updateData.greeting = {
        message: userAns.greeting.message,
        isCustom: userAns.greeting.isCustom,
      };
    }

    // Update user with address and greeting if they exist
    if (Object.keys(updateData).length > 0) {
      await this.userService.patch(userId, updateData);
    }

    await this.sessionModel.updateOne(
      { userId },
      { status: 'completed', updatedAt: new Date() },
    );

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
