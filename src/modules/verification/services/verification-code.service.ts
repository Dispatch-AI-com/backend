import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  VerificationCode,
  VerificationCodeDocument,
} from '../schemas/verification-code.schema';

@Injectable()
export class VerificationCodeService {
  private readonly logger = new Logger(VerificationCodeService.name);

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
}
