import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isEmail } from 'class-validator';
import { Model, Types, UpdateQuery } from 'mongoose';

import {
  Verification,
  VerificationDocument,
  VerificationType,
} from '@/modules/setting/schema/verification.schema';
import { User, UserDocument } from '@/modules/user/schema/user.schema';

import { normalizePhoneNumber } from './helpers/phone-number.util.js';
import {
  generateNumericCode,
  hashVerificationCode,
  verifyVerificationCode,
} from './helpers/verification-code.util.js';
import type { IEmailVerificationService } from './interfaces/email-verification.interface.js';
import type { ISmsVerificationService } from './interfaces/sms-verification.interface.js';

const DEFAULT_EMAIL_CODE_TTL_SECONDS = 10 * 60; // 10 minutes
const DEFAULT_EMAIL_RESEND_SECONDS = 60; // 1 minute
const DEFAULT_EMAIL_MAX_ATTEMPTS = 5;

const DEFAULT_SMS_CODE_TTL_SECONDS = 10 * 60; // 10 minutes
const DEFAULT_SMS_RESEND_SECONDS = 60; // 1 minute
const DEFAULT_SMS_MAX_ATTEMPTS = 5;

export interface UpdateVerificationDto {
  type: 'SMS' | 'Email' | 'Both';
  mobile?: string;
  email?: string;
  marketingPromotions?: boolean;
  mobileVerified?: boolean;
  emailVerified?: boolean;
}

// Only allow primitive values for listed keys, ignore all others
function sanitizeVerificationUpdate(
  input: Record<string, unknown>,
): Partial<UpdateVerificationDto> {
  const allowedKeys = [
    'type',
    'mobile',
    'email',
    'mobileVerified',
    'emailVerified',
    'marketingPromotions',
  ];
  const output: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const value = input[key];
      if (
        value === null ||
        value === undefined ||
        typeof value === 'string' ||
        typeof value === 'boolean' ||
        typeof value === 'number'
      ) {
        output[key] = value;
      }
    }
  }
  return output as Partial<UpdateVerificationDto>;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly emailCodeTtlMs: number;
  private readonly emailResendDelayMs: number;
  private readonly emailMaxAttempts: number;
  private readonly smsCodeTtlMs: number;
  private readonly smsResendDelayMs: number;
  private readonly smsMaxAttempts: number;

  constructor(
    @InjectModel(Verification.name)
    private readonly verificationModel: Model<VerificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject('IEmailVerificationService')
    private readonly emailVerificationService: IEmailVerificationService,
    @Inject('ISmsVerificationService')
    private readonly smsVerificationService: ISmsVerificationService,
    private readonly configService: ConfigService,
  ) {
    this.emailCodeTtlMs = this.resolveDurationMs(
      'VERIFICATION_EMAIL_TTL_SECONDS',
      DEFAULT_EMAIL_CODE_TTL_SECONDS,
    );
    this.emailResendDelayMs = this.resolveDurationMs(
      'VERIFICATION_EMAIL_RESEND_SECONDS',
      DEFAULT_EMAIL_RESEND_SECONDS,
    );
    this.emailMaxAttempts = this.resolvePositiveInt(
      'VERIFICATION_EMAIL_MAX_ATTEMPTS',
      DEFAULT_EMAIL_MAX_ATTEMPTS,
    );
    this.smsCodeTtlMs = this.resolveDurationMs(
      'VERIFICATION_SMS_TTL_SECONDS',
      DEFAULT_SMS_CODE_TTL_SECONDS,
    );
    this.smsResendDelayMs = this.resolveDurationMs(
      'VERIFICATION_SMS_RESEND_SECONDS',
      DEFAULT_SMS_RESEND_SECONDS,
    );
    this.smsMaxAttempts = this.resolvePositiveInt(
      'VERIFICATION_SMS_MAX_ATTEMPTS',
      DEFAULT_SMS_MAX_ATTEMPTS,
    );
  }

  async getVerification(userId: string): Promise<Verification | null> {
    const objectId = this.parseUserId(userId);

    const verification = await this.verificationModel
      .findOne({ userId: objectId })
      .exec();

    if (!verification) {
      const user = await this.userModel.findById(objectId).exec();
      if (user) {
        return {
          userId: objectId,
          type: VerificationType.BOTH,
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
    const objectId = this.parseUserId(userId);

    if (updateData.mobile !== undefined) {
      if (typeof updateData.mobile !== 'string') {
        throw new BadRequestException('Mobile number must be a string');
      }
      await this.userModel.findByIdAndUpdate(
        { _id: objectId },
        { fullPhoneNumber: updateData.mobile },
        { new: true },
      );
    }

    const safeUpdate = sanitizeVerificationUpdate(
      updateData as unknown as Record<string, unknown>,
    );

    const verification = await this.verificationModel
      .findOneAndUpdate({ userId: objectId }, safeUpdate, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .exec();

    return verification;
  }

  async sendEmailVerification(
    userId: string,
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    const objectId = this.parseUserId(userId);
    const normalizedEmail = this.normalizeEmail(email);

    const existing = await this.verificationModel
      .findOne({ userId: objectId })
      .lean<Verification | null>();

    const now = new Date();

    if (existing?.emailCode?.nextSendAllowedAt) {
      const nextAllowed = new Date(existing.emailCode.nextSendAllowedAt);
      if (nextAllowed > now) {
        const seconds = this.secondsRemaining(nextAllowed, now);
        throw new BadRequestException(
          `Verification code already sent. Please wait ${String(seconds)} second(s) before requesting a new code.`,
        );
      }
    }

    const code = generateNumericCode();

    // Get user info for personalized email
    const user = await this.userModel.findById(objectId).exec();

    try {
      await this.emailVerificationService.sendVerificationCode(
        normalizedEmail,
        code,
        user?.firstName,
      );
    } catch (error) {
      this.logger.error(
        `Unable to send verification email to ${normalizedEmail}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Unable to send verification email. Please try again later.',
      );
    }

    const codeHash = await hashVerificationCode(code);
    const expiresAt = new Date(now.getTime() + this.emailCodeTtlMs);
    const nextSendAllowedAt = new Date(now.getTime() + this.emailResendDelayMs);

    const update: UpdateQuery<VerificationDocument> = {
      $set: {
        email: normalizedEmail,
        emailVerified: false,
        emailCode: {
          codeHash,
          expiresAt,
          attemptCount: 0,
          sentAt: now,
          nextSendAllowedAt,
        },
      },
    };

    if (!existing) {
      update.$setOnInsert = {
        type: VerificationType.BOTH,
      } as Partial<Verification>;
    }

    await this.verificationModel
      .findOneAndUpdate({ userId: objectId }, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .exec();

    return {
      success: true,
      message: 'Verification email sent successfully.',
    };
  }

  async verifyEmail(
    userId: string,
    email: string,
    code: string,
  ): Promise<Verification> {
    const objectId = this.parseUserId(userId);
    const normalizedEmail = this.normalizeEmail(email);
    const sanitizedCode = this.normalizeCode(code);

    const verification = await this.verificationModel
      .findOne({ userId: objectId })
      .exec();

    if (!verification || !verification.emailCode) {
      throw new NotFoundException(
        'No verification request found for this user.',
      );
    }

    if (
      verification.email &&
      verification.email.toLowerCase() !== normalizedEmail.toLowerCase()
    ) {
      throw new BadRequestException(
        'Email address does not match the pending verification request.',
      );
    }

    const { emailCode } = verification;

    if (emailCode.expiresAt && emailCode.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired.');
    }

    if (emailCode.attemptCount >= this.emailMaxAttempts) {
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please request a new code.',
      );
    }

    const isValid = await verifyVerificationCode(
      sanitizedCode,
      emailCode.codeHash ?? '',
    );

    if (!isValid) {
      const nextAttemptCount = emailCode.attemptCount + 1;
      await this.verificationModel
        .updateOne(
          { userId: objectId },
          { $inc: { 'emailCode.attemptCount': 1 } },
        )
        .exec();

      const remaining = Math.max(this.emailMaxAttempts - nextAttemptCount, 0);
      const message =
        remaining > 0
          ? `Invalid verification code. ${String(remaining)} attempt(s) remaining.`
          : 'Invalid verification code. Maximum attempts exceeded.';
      throw new BadRequestException(message);
    }

    await this.verificationModel
      .updateOne(
        { userId: objectId },
        {
          $set: {
            emailVerified: true,
            email: normalizedEmail,
          },
          $unset: {
            emailCode: '',
          },
        },
      )
      .exec();

    await this.userModel
      .findByIdAndUpdate(objectId, { email: normalizedEmail }, { new: true })
      .exec();

    const updatedVerification = await this.verificationModel
      .findOne({ userId: objectId })
      .exec();

    if (!updatedVerification) {
      throw new InternalServerErrorException(
        'Verification record missing after email confirmation.',
      );
    }

    return updatedVerification;
  }

  async sendSmsVerification(
    userId: string,
    mobile: string,
  ): Promise<{ success: boolean; message?: string }> {
    const objectId = this.parseUserId(userId);
    const normalizedMobile = normalizePhoneNumber(mobile);

    const existing = await this.verificationModel
      .findOne({ userId: objectId })
      .lean<Verification | null>();

    const now = new Date();

    if (existing?.mobileCode?.nextSendAllowedAt) {
      const nextAllowed = new Date(existing.mobileCode.nextSendAllowedAt);
      if (nextAllowed > now) {
        const seconds = this.secondsRemaining(nextAllowed, now);
        throw new BadRequestException(
          `Verification code already sent. Please wait ${String(seconds)} second(s) before requesting a new code.`,
        );
      }
    }

    const code = generateNumericCode();

    try {
      await this.smsVerificationService.sendVerificationCode(
        normalizedMobile,
        code,
      );
    } catch (error) {
      this.logger.error(
        `Unable to send verification SMS to ${normalizedMobile}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Unable to send verification SMS. Please try again later.',
      );
    }

    const codeHash = await hashVerificationCode(code);
    const expiresAt = new Date(now.getTime() + this.smsCodeTtlMs);
    const nextSendAllowedAt = new Date(now.getTime() + this.smsResendDelayMs);

    const update: UpdateQuery<VerificationDocument> = {
      $set: {
        mobile: normalizedMobile,
        mobileVerified: false,
        mobileCode: {
          codeHash,
          expiresAt,
          attemptCount: 0,
          sentAt: now,
          nextSendAllowedAt,
        },
      },
    };

    if (!existing) {
      update.$setOnInsert = {
        type: VerificationType.BOTH,
      } as Partial<Verification>;
    }

    await this.verificationModel
      .findOneAndUpdate({ userId: objectId }, update, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .exec();

    return {
      success: true,
      message: 'Verification SMS sent successfully.',
    };
  }

  async verifySms(
    userId: string,
    mobile: string,
    code: string,
  ): Promise<Verification> {
    const objectId = this.parseUserId(userId);
    const normalizedMobile = normalizePhoneNumber(mobile);
    const sanitizedCode = this.normalizeCode(code);

    const verification = await this.verificationModel
      .findOne({ userId: objectId })
      .exec();

    if (!verification || !verification.mobileCode) {
      throw new NotFoundException(
        'No verification request found for this user.',
      );
    }

    if (verification.mobile && verification.mobile !== normalizedMobile) {
      throw new BadRequestException(
        'Mobile number does not match the pending verification request.',
      );
    }

    const { mobileCode } = verification;

    if (mobileCode.expiresAt && mobileCode.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired.');
    }

    if (mobileCode.attemptCount >= this.smsMaxAttempts) {
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please request a new code.',
      );
    }

    const isValid = await verifyVerificationCode(
      sanitizedCode,
      mobileCode.codeHash ?? '',
    );

    if (!isValid) {
      const nextAttemptCount = mobileCode.attemptCount + 1;
      await this.verificationModel
        .updateOne(
          { userId: objectId },
          { $inc: { 'mobileCode.attemptCount': 1 } },
        )
        .exec();

      const remaining = Math.max(this.smsMaxAttempts - nextAttemptCount, 0);
      const message =
        remaining > 0
          ? `Invalid verification code. ${String(remaining)} attempt(s) remaining.`
          : 'Invalid verification code. Maximum attempts exceeded.';
      throw new BadRequestException(message);
    }

    await this.verificationModel
      .updateOne(
        { userId: objectId },
        {
          $set: {
            mobileVerified: true,
            mobile: normalizedMobile,
          },
          $unset: {
            mobileCode: '',
          },
        },
      )
      .exec();

    await this.userModel
      .findByIdAndUpdate(
        objectId,
        { fullPhoneNumber: normalizedMobile },
        { new: true },
      )
      .exec();

    const updatedVerification = await this.verificationModel
      .findOne({ userId: objectId })
      .exec();

    if (!updatedVerification) {
      throw new InternalServerErrorException(
        'Verification record missing after SMS confirmation.',
      );
    }

    return updatedVerification;
  }

  private resolveDurationMs(key: string, fallbackSeconds: number): number {
    const raw = this.configService.get<string | number | undefined>(key);
    if (raw === undefined || (typeof raw === 'string' && raw === '')) {
      return fallbackSeconds * 1000;
    }

    const numeric = Number(raw);
    if (Number.isNaN(numeric) || numeric <= 0) {
      this.logger.warn(
        `Invalid value for ${key}: ${String(raw)}. Falling back to ${String(fallbackSeconds)} seconds.`,
      );
      return fallbackSeconds * 1000;
    }

    return numeric * 1000;
  }

  private resolvePositiveInt(key: string, fallback: number): number {
    const raw = this.configService.get<string | number | undefined>(key);
    if (raw === undefined || (typeof raw === 'string' && raw === '')) {
      return fallback;
    }

    const numeric = Number(raw);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      this.logger.warn(
        `Invalid value for ${key}: ${String(raw)}. Falling back to ${String(fallback)}.`,
      );
      return fallback;
    }

    return numeric;
  }

  private parseUserId(userId: string): Types.ObjectId {
    try {
      return new Types.ObjectId(userId);
    } catch {
      throw new BadRequestException('Invalid user id.');
    }
  }

  private normalizeEmail(email: string): string {
    if (typeof email !== 'string') {
      throw new BadRequestException('Email address is required.');
    }

    const normalized = email.trim().toLowerCase();
    if (!isEmail(normalized)) {
      throw new BadRequestException('Invalid email address format.');
    }

    return normalized;
  }

  private normalizeCode(code: string): string {
    if (typeof code !== 'string') {
      throw new BadRequestException('Verification code is required.');
    }

    const trimmed = code.trim();
    if (!/^[0-9]{4,10}$/.test(trimmed)) {
      throw new BadRequestException(
        'Verification code must be a numeric value.',
      );
    }

    return trimmed;
  }

  private secondsRemaining(target: Date, now: Date): number {
    return Math.max(Math.ceil((target.getTime() - now.getTime()) / 1000), 0);
  }
}
