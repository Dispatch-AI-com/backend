import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from '@/modules/user/schema/user.schema';

import { UpdateVerificationDto } from '../dto/verification.dto';
import {
  Verification,
  VerificationDocument,
} from '../schemas/verification.schema';
import { AwsSesEmailVerificationService } from './aws-ses-email-verification.service';
import { AwsSnsSmsVerificationService } from './aws-sns-sms-verification.service';
import { VerificationCodeService } from './verification-code.service';


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
    private readonly awsSesEmailVerificationService: AwsSesEmailVerificationService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly awsSnsSmsVerificationService: AwsSnsSmsVerificationService,
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
          mobile: user.fullPhoneNumber ?? '',
          email: user.email,
          mobileVerified: false,
          emailVerified: false,
          marketingPromotions: false,
        } as Verification;
      }
    }
    return verification as Verification;
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
        userId,
        { fullPhoneNumber: updateData.mobile },
        { new: true },
      );
    }

    // Sanitize updateData to allow only expected fields, preventing operator injection
    const safeUpdate = sanitizeVerificationUpdate(updateData as unknown as Record<string, unknown>);

    const verification = await this.verificationModel
      .findOneAndUpdate({ userId: new Types.ObjectId(userId) }, safeUpdate, {
        new: true,
        upsert: true,
      })
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

  async sendEmailVerification(
    userId: string,
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Generate verification code
      const verificationCode =
        this.awsSesEmailVerificationService.generateVerificationCode();

      // Store verification code
      await this.verificationCodeService.createVerificationCode(
        userId,
        email,
        verificationCode,
        'email',
      );

      // Get user info for personalized email
      const user = await this.userModel.findById(userId).exec();

      // Send verification email
      const result =
        await this.awsSesEmailVerificationService.sendVerificationEmail(
          email,
          verificationCode,
          user?.firstName,
        );

      return result;
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send verification email',
      };
    }
  }

  async verifyEmail(
    userId: string,
    email: string,
    code: string,
  ): Promise<Verification> {
    // Verify the code
    const isValidCode = await this.verificationCodeService.verifyCode(
      userId,
      email,
      code,
      'email',
    );

    if (!isValidCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Get user info
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Try to find existing verification record
    let verification = await this.verificationModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!verification) {
      // Create new verification record if it doesn't exist
      verification = new this.verificationModel({
        userId: new Types.ObjectId(userId),
        type: 'Both',
        email: user.email,
        mobile: user.fullPhoneNumber || '',
        emailVerified: true,
        mobileVerified: false,
        marketingPromotions: false,
      });
      await verification.save();
    } else {
      // Update existing verification record
      verification.emailVerified = true;
      await verification.save();
    }

    // Update user model
    await this.userModel
      .findByIdAndUpdate(userId, { emailVerified: true })
      .exec();

    return verification;
  }

  async sendSmsVerification(
    userId: string,
    phoneNumber: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Generate verification code
      const verificationCode =
        this.awsSnsSmsVerificationService.generateVerificationCode();

      // Store verification code
      await this.verificationCodeService.createVerificationCode(
        userId,
        phoneNumber,
        verificationCode,
        'phone',
      );

      // Send verification SMS
      const result =
        await this.awsSnsSmsVerificationService.sendVerificationSms(
          phoneNumber,
          verificationCode,
        );
      return result;
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send SMS verification',
      };
    }
  }

  async verifySms(
    userId: string,
    phoneNumber: string,
    code: string,
  ): Promise<Verification> {
    // Verify the SMS code using verification code service
    const isValidCode = await this.verificationCodeService.verifyCode(
      userId,
      phoneNumber,
      code,
      'phone',
    );

    if (!isValidCode) {
      throw new BadRequestException('Invalid or expired SMS verification code');
    }

    // Get user info
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Try to find existing verification record
    let verification = await this.verificationModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!verification) {
      // Create new verification record if it doesn't exist
      verification = new this.verificationModel({
        userId: new Types.ObjectId(userId),
        type: 'Both',
        email: user.email,
        mobile: phoneNumber,
        emailVerified: false,
        mobileVerified: true,
        marketingPromotions: false,
      });
      await verification.save();
    } else {
      // Update existing verification record
      verification.mobileVerified = true;
      verification.mobile = phoneNumber;
      await verification.save();
    }

    // Update user model
    await this.userModel
      .findByIdAndUpdate(userId, { phoneVerified: true })
      .exec();

    return verification;
  }
}
