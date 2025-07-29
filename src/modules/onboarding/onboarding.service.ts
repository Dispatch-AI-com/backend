import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { Model, UpdateQuery } from 'mongoose';

import { CompanyService } from '../company/company.service';
import { CreateCompanyDto } from '../company/dto/create-company.dto';
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
    'company.address.full': function (answer, update) {
      const match = this.AU_ADDR_REGEX.exec(answer.trim());
      if (!match?.groups) {
        throw new BadRequestException(
          'Unable to parse address; please check the format.',
        );
      }
      update.$set['answers.company.address.streetAddress'] =
        match.groups.street.trim();
      update.$set['answers.company.address.suburb'] =
        match.groups.suburb.trim();
      update.$set['answers.company.address.state'] = match.groups.state;
      update.$set['answers.company.address.postcode'] = match.groups.postcode;
      update.$set['answers.company.address.full'] = answer; // raw string
    },

    'company.abn': async function (answer, update) {
      const exists = await this.companyService.existsByAbn(answer.trim());
      if (exists) {
        throw new ConflictException('Company with this ABN already exists.');
      }
      update.$set['answers.company.abn'] = answer.trim();
    },
  };

  constructor(
    @InjectModel(OnboardingSession.name)
    private readonly sessionModel: Model<OnboardingSessionDocument>,
    private readonly companyService: CompanyService,
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

    if (field.startsWith('user.')) {
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

    const companyAns = session.answers.company;
    if (!companyAns) {
      throw new BadRequestException('company answers not found in session');
    }

    const user = await this.userService.findOne(userId);
    const email = user.email;

    const companyPayload = {
      businessName: companyAns.businessName,
      address: {
        unitAptPOBox: companyAns.address.unitAptPOBox ?? '',
        streetAddress: companyAns.address.streetAddress,
        suburb: companyAns.address.suburb,
        state: companyAns.address.state,
        postcode: companyAns.address.postcode,
      },
      email: email,
      abn: companyAns.abn,
      user: userId,
    };

    try {
      const dto = plainToInstance(CreateCompanyDto, companyPayload);
      await validateOrReject(dto);
      await this.companyService.create(dto);
    } catch (err: unknown) {
      // handle index uniqueness conflict
      if (
        err !== null &&
        err !== undefined &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: number }).code === 11000
      ) {
        throw new ConflictException('Company email/abn/phone already exists');
      }
      throw err;
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
