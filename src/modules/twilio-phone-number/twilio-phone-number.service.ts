import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  TwilioPhoneNumber,
  TwilioPhoneNumberDocument,
  TwilioPhoneNumberStatus,
} from './schema/twilio-phone-number.schema';

@Injectable()
export class TwilioPhoneNumberService {
  private readonly logger = new Logger(TwilioPhoneNumberService.name);

  constructor(
    @InjectModel(TwilioPhoneNumber.name)
    private readonly twilioPhoneNumberModel: Model<TwilioPhoneNumberDocument>,
  ) {}

  async create(phoneNumber: string): Promise<TwilioPhoneNumberDocument> {
    const existing = await this.twilioPhoneNumberModel
      .findOne({ phoneNumber })
      .exec();
    if (existing) {
      throw new BadRequestException(
        `Phone number ${phoneNumber} already exists`,
      );
    }

    const newNumber = await this.twilioPhoneNumberModel.create({
      phoneNumber,
      status: TwilioPhoneNumberStatus.available,
    });

    this.logger.log(`Phone number ${phoneNumber} added to pool`);
    return newNumber;
  }

  async getAvailable(): Promise<TwilioPhoneNumberDocument | null> {
    return this.twilioPhoneNumberModel
      .findOne({ status: TwilioPhoneNumberStatus.available })
      .exec();
  }

  async markAsAssigned(phoneNumberId: string): Promise<void> {
    const updated = await this.twilioPhoneNumberModel
      .findByIdAndUpdate(
        phoneNumberId,
        { status: TwilioPhoneNumberStatus.assigned },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Phone number ${phoneNumberId} not found`);
    }

    this.logger.log(`Phone number ${phoneNumberId} marked as assigned`);
  }

  async markAsAvailable(phoneNumberId: string): Promise<void> {
    const updated = await this.twilioPhoneNumberModel
      .findByIdAndUpdate(
        phoneNumberId,
        { status: TwilioPhoneNumberStatus.available },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Phone number ${phoneNumberId} not found`);
    }

    this.logger.log(`Phone number ${phoneNumberId} marked as available`);
  }

  async findById(
    phoneNumberId: string,
  ): Promise<TwilioPhoneNumberDocument | null> {
    return this.twilioPhoneNumberModel.findById(phoneNumberId).exec();
  }

  async findByPhoneNumber(
    phoneNumber: string,
  ): Promise<TwilioPhoneNumberDocument | null> {
    return this.twilioPhoneNumberModel.findOne({ phoneNumber }).exec();
  }

  async findAll(): Promise<TwilioPhoneNumberDocument[]> {
    return this.twilioPhoneNumberModel.find().exec();
  }

  async delete(phoneNumberId: string): Promise<void> {
    const deleted = await this.twilioPhoneNumberModel
      .findByIdAndDelete(phoneNumberId)
      .exec();

    if (!deleted) {
      throw new NotFoundException(`Phone number ${phoneNumberId} not found`);
    }

    this.logger.log(`Phone number ${phoneNumberId} deleted from pool`);
  }
}
