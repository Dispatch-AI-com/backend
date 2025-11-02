import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

// Only allow primitive values for listed keys, ignore all others
function sanitizeVerificationUpdate(input: Record<string, unknown>): Partial<UpdateVerificationDto> {
  const allowedKeys = ['type', 'mobile', 'email', 'mobileVerified', 'emailVerified', 'marketingPromotions'];
  const output: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const value = input[key];
      // Only allow primitive values (string, boolean, number, null/undefined)
      if (value === null || value === undefined ||
          typeof value === 'string' ||
          typeof value === 'boolean' ||
          typeof value === 'number') {
        output[key] = value;
      }
    }
  }
  return output as Partial<UpdateVerificationDto>;
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
      if (typeof updateData.mobile !== 'string') {
        throw new BadRequestException('Mobile number must be a string');
      }
      await this.userModel.findByIdAndUpdate(
        { _id: { $eq: new Types.ObjectId(userId) } },
        { fullPhoneNumber: updateData.mobile },
        { new: true },
      );
    }

    // Sanitize updateData to allow only expected fields, preventing operator injection
    const safeUpdate = sanitizeVerificationUpdate(updateData as unknown as Record<string, unknown>);

    const verification = await this.verificationModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        safeUpdate,
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
