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
  // More flexible regex patterns for Australian addresses
  AU_ADDR_REGEX_STRICT =
    /^(?<street>[^,]+),\s*(?<suburb>[^,]+),\s*(?<state>[A-Z]{2,3})\s+(?<postcode>\d{4})$/;

  // Pattern for addresses with state and postcode together: "Street, Suburb, State Postcode"
  AU_ADDR_REGEX_FLEXIBLE =
    /^(?<street>[^,]+),\s*(?<suburb>[^,]+),\s*(?<state>[A-Z]{2,3})\s*(?<postcode>\d{4})$/;

  // Pattern for addresses with state and postcode separated: "Street, Suburb, State, Postcode"
  AU_ADDR_REGEX_SEPARATED =
    /^(?<street>[^,]+),\s*(?<suburb>[^,]+),\s*(?<state>[A-Z]{2,3}),\s*(?<postcode>\d{4})$/;

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
      const trimmedAnswer = answer.trim();

      // Try multiple regex patterns
      let match = this.AU_ADDR_REGEX_STRICT.exec(trimmedAnswer);
      if (!match?.groups) {
        match = this.AU_ADDR_REGEX_FLEXIBLE.exec(trimmedAnswer);
      }
      if (!match?.groups) {
        match = this.AU_ADDR_REGEX_SEPARATED.exec(trimmedAnswer);
      }

      // If regex doesn't match, try to parse manually from comma-separated values
      if (!match?.groups) {
        const parts = trimmedAnswer
          .split(',')
          .map(p => p.trim())
          .filter(p => p);

        if (parts.length >= 3) {
          // Try to extract state and postcode from the last part
          const lastPart = parts[parts.length - 1];
          const statePostcodeMatch = /^([A-Z]{2,3})\s*(\d{4})$/.exec(lastPart);

          if (statePostcodeMatch) {
            // Format: "Street, Suburb, State Postcode" (3 parts) or more
            // For 3 parts: parts[0] is street, parts[1] is suburb
            // For more parts: join all but last 2 as street
            const streetAddress =
              parts.length === 3 ? parts[0] : parts.slice(0, -2).join(', ');
            const suburb = parts[parts.length - 2];
            const state = statePostcodeMatch[1];
            const postcode = statePostcodeMatch[2];

            update.$set['answers.user.address.streetAddress'] = streetAddress;
            update.$set['answers.user.address.suburb'] = suburb;
            update.$set['answers.user.address.state'] = state;
            update.$set['answers.user.address.postcode'] = postcode;
            update.$set['answers.user.address.full'] = answer;
            return;
          }

          // Try to extract state and postcode separately
          if (parts.length >= 4) {
            const stateMatch = /^([A-Z]{2,3})$/.exec(parts[parts.length - 2]);
            const postcodeMatch = /^(\d{4})$/.exec(parts[parts.length - 1]);

            if (stateMatch && postcodeMatch) {
              // Format: "Street, Suburb, State, Postcode" (4 parts) or more
              // For 4 parts: parts[0] is street, parts[1] is suburb
              // For more parts: join all but last 3 as street
              const streetAddress =
                parts.length === 4 ? parts[0] : parts.slice(0, -3).join(', ');
              const suburb = parts[parts.length - 3];
              const state = stateMatch[1];
              const postcode = postcodeMatch[1];

              update.$set['answers.user.address.streetAddress'] = streetAddress;
              update.$set['answers.user.address.suburb'] = suburb;
              update.$set['answers.user.address.state'] = state;
              update.$set['answers.user.address.postcode'] = postcode;
              update.$set['answers.user.address.full'] = answer;
              return;
            }
          }
        }

        // If all parsing attempts fail, throw error
        throw new BadRequestException(
          'Unable to parse address; please check the format. Expected format: "Street Address, Suburb, State Postcode" (e.g., "123 Main St, Sydney, NSW 2000")',
        );
      }

      // Use regex match results
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

    // Special case: if this is the demo step (step 6, field is empty), and user clicks Skip or Demo,
    // mark onboarding as completed (nextStep will be beyond the last step)
    // Only treat empty field as skip action for the specific demo step (step 6)
    const DEMO_STEP_ID = 6;
    if (stepId === DEMO_STEP_ID && (!field || field.trim() === '')) {
      // This is the demo step (step 6), which is the last step
      // After this, onboarding should be completed
      nextStep = stepId + 1; // This will be 7, which is beyond the last step (6)
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
    } else if (field && field.trim()) {
      // Regular field with value - save to answers
      update.$set[`answers.${field}`] = answer.trim();
    } else {
      // Empty field means it's a demo/skip step - just advance to next step
      // No need to save anything, just update currentStep
      // This is handled by the update.$set.currentStep already set above
    }

    await this.sessionModel.updateOne({ userId }, update, { upsert: true });

    // Handle direct user field updates (phone, position)
    if (
      field.startsWith('user.') &&
      !field.includes('address') &&
      !field.includes('greeting')
    ) {
      const parts = field.split('.');
      if (parts.length >= 2 && parts[1]) {
        const key = parts[1];
        await this.userService.patch(userId, { [key]: answer.trim() });
      }
    }

    // Handle address update immediately after parsing
    if (field === 'user.address.full') {
      // Ensure all required fields are present after parsing
      const streetAddress = update.$set['answers.user.address.streetAddress'];
      const suburb = update.$set['answers.user.address.suburb'];
      const state = update.$set['answers.user.address.state'];
      const postcode = update.$set['answers.user.address.postcode'];

      // Collect missing fields for detailed error message
      const missingFields: string[] = [];
      if (!streetAddress) missingFields.push('streetAddress');
      if (!suburb) missingFields.push('suburb');
      if (!state) missingFields.push('state');
      if (!postcode) missingFields.push('postcode');

      if (missingFields.length > 0) {
        throw new BadRequestException(
          `Address parsing failed: missing required fields - ${missingFields.join(', ')}`,
        );
      }

      const addressData = {
        unitAptPOBox: update.$set['answers.user.address.unitAptPOBox'] ?? '',
        streetAddress,
        suburb,
        state,
        postcode,
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
