import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Verification,
  VerificationDocument,
} from '@/modules/setting/schema/verification.schema';

export interface UpdateVerificationDto {
  type: 'SMS' | 'Email' | 'Both';
  mobile?: string;
  email?: string;
  marketingPromotions?: boolean;
}

@Injectable()
export class VerificationService {
  constructor(
    @InjectModel(Verification.name)
    private verificationModel: Model<VerificationDocument>,
  ) {}

  async getVerification(userId: string): Promise<Verification | null> {
    return this.verificationModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async updateVerification(
    userId: string,
    updateData: UpdateVerificationDto,
  ): Promise<Verification> {
    // Only allow whitelisted fields to be updated
    const allowedFields = ['type', 'mobile', 'email', 'marketingPromotions'];
    const sanitizedUpdate: Record<string, string | boolean | undefined> = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        sanitizedUpdate[key] = updateData[key as keyof UpdateVerificationDto];
      }
    }
    const verification = await this.verificationModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: sanitizedUpdate },
        { new: true, upsert: true },
      )
      .exec();

    return verification;
  }

  async verifyMobile(userId: string, mobile: string): Promise<Verification> {
    const verification = await this.verificationModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { mobileVerified: true },
        { new: true }
      )
      .exec();

    if (!verification) {
      throw new NotFoundException('Verification record not found');
    }

    return verification;
  }

  async verifyEmail(userId: string, email: string): Promise<Verification> {
    const verification = await this.verificationModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { emailVerified: true },
        { new: true }
      )
      .exec();

    if (!verification) {
      throw new NotFoundException('Verification record not found');
    }

    return verification;
  }
}
