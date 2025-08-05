import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Verification,
  VerificationDocument,
} from '@/modules/setting/schema/verification.schema';
import { User, UserDocument } from '@/modules/user/schema/user.schema';

export interface UpdateVerificationDto {
  type: 'SMS' | 'Email' | 'Both';
  mobile?: string;
  email?: string;
  marketingPromotions?: boolean;
  mobileVerified?: boolean;
  emailVerified?: boolean;
}

@Injectable()
export class VerificationService {
  constructor(
    @InjectModel(Verification.name)
    private verificationModel: Model<VerificationDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async getVerification(userId: string): Promise<Verification | null> {
    const verification = await this.verificationModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    // If no verification record exists, return default with User data
    if (!verification) {
      const user = await this.userModel.findById(userId).exec();
      if (user) {
        return {
          userId: new Types.ObjectId(userId),
          type: 'Both',
          mobile: user.fullPhoneNumber || '',
          email: user.email || '',
          mobileVerified: false,
          emailVerified: false,
          marketingPromotions: false,
        } as Verification;
      }
    }
    return verification;
  }

  async updateVerification(
    userId: string,
    updateData: UpdateVerificationDto,
  ): Promise<Verification> {
    // If mobile number is being updated, also update User model
    if (updateData.mobile !== undefined) {
      await this.userModel.findByIdAndUpdate(
        userId,
        { fullPhoneNumber: updateData.mobile },
        { new: true },
      );
    }

    const verification = await this.verificationModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { ...updateData },
        { new: true, upsert: true },
      )
      .exec();

    return verification;
  }

  async verifyMobile(userId: string, _mobile: string): Promise<Verification> {
    const verification = await this.verificationModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { mobileVerified: true },
        { new: true },
      )
      .exec();

    if (!verification) {
      throw new NotFoundException('Verification record not found');
    }

    return verification;
  }

  async verifyEmail(userId: string, _email: string): Promise<Verification> {
    const verification = await this.verificationModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { emailVerified: true },
        { new: true },
      )
      .exec();

    if (!verification) {
      throw new NotFoundException('Verification record not found');
    }

    return verification;
  }
}
