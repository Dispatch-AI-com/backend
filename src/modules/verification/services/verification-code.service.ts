import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  VerificationCode,
  VerificationCodeDocument,
} from '../schemas/verification-code.schema';

@Injectable()
export class VerificationCodeService {
  private readonly logger = new Logger(VerificationCodeService.name);
  private readonly COOLDOWN_PERIOD = 60 * 1000; // 60 seconds
  private readonly MAX_ATTEMPTS_PER_HOUR = 5; // Maximum 5 attempts per hour

  constructor(
    @InjectModel(VerificationCode.name)
    private verificationCodeModel: Model<VerificationCodeDocument>,
  ) {}

  async createVerificationCode(
    userId: string,
    contact: string,
    code: string,
    type: 'email' | 'phone' = 'email',
  ): Promise<VerificationCode> {
    this.logger.log(
      `Creating verification code for user ${userId}, contact ${contact}, code ${code}`,
    );

    // Check cooldown period
    await this.checkCooldownPeriod(userId, contact, type);

    // Check rate limiting
    await this.checkRateLimit(userId, contact, type);

    // Remove any existing codes for this user and contact
    await this.verificationCodeModel.deleteMany({
      userId: new Types.ObjectId(userId),
      contact: { $eq: contact },
      type: { $eq: type },
    });

    // Create new verification code
    const verificationCode = new this.verificationCodeModel({
      userId: new Types.ObjectId(userId),
      contact,
      code,
      type,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      sentAt: new Date(), // Track when sent
    });

    const savedCode = await verificationCode.save();
    this.logger.log(
      `Verification code saved with ID: ${String(savedCode._id)}`,
    );
    return savedCode;
  }

  async verifyCode(
    userId: string,
    contact: string,
    code: string,
    type: 'email' | 'phone' = 'email',
  ): Promise<boolean> {
    this.logger.log(
      `Verifying code for user ${userId}, contact ${contact}, code ${code}, type ${type}`,
    );

    const verificationCode = await this.verificationCodeModel.findOne({
      userId: new Types.ObjectId(userId),
      contact: { $eq: contact },
      code: { $eq: code },
      type: { $eq: type },
      expiresAt: { $gt: new Date() },
    });

    this.logger.log(
      `Found verification code: ${verificationCode ? 'YES' : 'NO'}`,
    );

    if (verificationCode) {
      // Remove the used code
      await this.verificationCodeModel.deleteOne({ _id: verificationCode._id });
      this.logger.log(`Verification code verified and removed`);
      return true;
    }

    this.logger.log(`Verification code not found or expired`);
    return false;
  }

  async cleanupExpiredCodes(): Promise<void> {
    const result = await this.verificationCodeModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    if (result.deletedCount > 0) {
      this.logger.log(
        `Cleaned up ${String(result.deletedCount)} expired verification codes`,
      );
    }
  }

  private async checkCooldownPeriod(
    userId: string,
    contact: string,
    type: 'email' | 'phone',
  ): Promise<void> {
    const recentCode = await this.verificationCodeModel
      .findOne({
        userId: new Types.ObjectId(userId),
        contact: { $eq: contact },
        type: { $eq: type },
        sentAt: { $gte: new Date(Date.now() - this.COOLDOWN_PERIOD) },
      })
      .exec();

    if (recentCode) {
      const remainingTime = Math.ceil(
        (recentCode.sentAt.getTime() + this.COOLDOWN_PERIOD - Date.now()) / 1000,
      );
      throw new BadRequestException(
        `Please wait ${remainingTime.toString()} seconds before requesting another verification code`,
      );
    }
  }

  private async checkRateLimit(
    userId: string,
    contact: string,
    type: 'email' | 'phone',
  ): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentAttempts = await this.verificationCodeModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        contact: { $eq: contact },
        type: { $eq: type },
        sentAt: { $gte: oneHourAgo },
      })
      .exec();

    if (recentAttempts >= this.MAX_ATTEMPTS_PER_HOUR) {
      throw new BadRequestException(
        `Too many verification attempts. Please try again later. Maximum ${this.MAX_ATTEMPTS_PER_HOUR.toString()} attempts per hour allowed.`,
      );
    }
  }
}

