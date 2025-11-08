import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';

import {
  Subscription,
  SubscriptionDocument,
} from '../subscription/schema/subscription.schema';
import { SubscriptionService } from '../subscription/subscription.service';
import { TwilioPhoneNumberService } from '../twilio-phone-number/twilio-phone-number.service';
import {
  TwilioPhoneNumberAssignment,
  TwilioPhoneNumberAssignmentDocument,
  TwilioPhoneNumberAssignmentStatus,
} from './schema/twilio-phone-number-assignment.schema';

@Injectable()
export class TwilioPhoneNumberAssignmentService {
  private readonly logger = new Logger(TwilioPhoneNumberAssignmentService.name);

  constructor(
    @InjectModel(TwilioPhoneNumberAssignment.name)
    private readonly assignmentModel: Model<TwilioPhoneNumberAssignmentDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly twilioPhoneNumberService: TwilioPhoneNumberService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkExpiredAssignments(): Promise<void> {
    this.logger.log('Checking expired phone number assignments...');

    const now = new Date();
    const expiredAssignments = await this.assignmentModel
      .find({
        status: TwilioPhoneNumberAssignmentStatus.active,
        expiresAt: { $lte: now },
      })
      .exec();

    this.logger.log(
      `Found ${String(expiredAssignments.length)} expired assignments`,
    );

    for (const assignment of expiredAssignments) {
      try {
        const userId = assignment.userId.toString();

        // Try to find subscription (including all statuses: active, cancelled, pending_cancellation, failed)
        let shouldUnbind = true;
        const subscription = await this.subscriptionModel
          .findOne({
            userId: new Types.ObjectId(userId),
            status: {
              $in: [
                'active',
                'cancelled',
                'pending_cancellation',
                'pending_downgrade',
                'failed',
              ],
            },
          })
          .sort({ createdAt: -1 }) // Get the most recent subscription
          .exec();

        if (subscription) {
          // Calculate target expiration: subscription endAt + 7 days
          const targetExpiresAt = new Date(subscription.endAt);
          targetExpiresAt.setDate(targetExpiresAt.getDate() + 7);

          if (subscription.status === 'active' && subscription.endAt > now) {
            // Active subscription: extend to subscription endAt + 7 days
            await this.extendExpiration(userId, subscription.endAt);
            this.logger.log(
              `Extended assignment for user ${userId} (has active subscription until ${subscription.endAt.toISOString()})`,
            );
            shouldUnbind = false;
          } else if (
            subscription.status === 'active' &&
            subscription.endAt <= now
          ) {
            // Active subscription but expired: extend to endAt + 7 days (grace period)
            // This handles cases where subscription expired but status hasn't updated yet
            if (targetExpiresAt > now) {
              await this.extendExpiration(userId, subscription.endAt);
              this.logger.log(
                `Extended assignment for user ${userId} (active subscription expired, grace period until ${targetExpiresAt.toISOString()})`,
              );
              shouldUnbind = false;
            } else {
              // Grace period also expired: unbind
              this.logger.log(
                `Subscription grace period expired for user ${userId} (ended at ${subscription.endAt.toISOString()}, grace period ended at ${targetExpiresAt.toISOString()})`,
              );
              shouldUnbind = true;
            }
          } else if (
            (subscription.status === 'cancelled' ||
              subscription.status === 'pending_cancellation' ||
              subscription.status === 'failed') &&
            targetExpiresAt > now
          ) {
            // Cancelled subscription but still within grace period: extend to endAt + 7 days
            await this.extendExpiration(userId, subscription.endAt);
            this.logger.log(
              `Extended assignment for user ${userId} (cancelled subscription, grace period until ${targetExpiresAt.toISOString()})`,
            );
            shouldUnbind = false;
          } else if (targetExpiresAt <= now) {
            // Subscription ended and grace period expired: unbind
            this.logger.log(
              `Subscription grace period expired for user ${userId} (ended at ${subscription.endAt.toISOString()}, grace period ended at ${targetExpiresAt.toISOString()})`,
            );
            shouldUnbind = true;
          }
        } else {
          // No subscription found: unbind
          this.logger.log(
            `No subscription found for user ${userId}, unbinding phone number`,
          );
          shouldUnbind = true;
        }

        if (shouldUnbind) {
          await this.unbindPhoneNumber(userId, String(assignment._id));
          this.logger.log(`Unbound phone number for user ${userId}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to process expired assignment ${String(assignment._id)}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Finished checking expired assignments');
  }

  async assignPhoneNumber(
    userId: string,
    subscriptionEndAt: Date,
  ): Promise<TwilioPhoneNumberAssignmentDocument> {
    const existing = await this.assignmentModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: TwilioPhoneNumberAssignmentStatus.active,
      })
      .exec();

    if (existing) {
      this.logger.log(
        `User ${userId} already has active assignment, extending expiration`,
      );
      return this.extendExpiration(userId, subscriptionEndAt);
    }

    const availableNumber = await this.twilioPhoneNumberService.getAvailable();

    if (!availableNumber) {
      throw new NotFoundException('No available phone numbers in pool');
    }

    const expiresAt = new Date(subscriptionEndAt);
    expiresAt.setDate(expiresAt.getDate() + 7);

    const assignment = await this.assignmentModel.create({
      userId: new Types.ObjectId(userId),
      phoneNumberId: availableNumber._id,
      phoneNumber: availableNumber.phoneNumber,
      assignedAt: new Date(),
      expiresAt,
      status: TwilioPhoneNumberAssignmentStatus.active,
    });

    await this.twilioPhoneNumberService.markAsAssigned(
      String(availableNumber._id),
    );

    this.logger.log(
      `Phone number ${availableNumber.phoneNumber} assigned to user ${userId}, expires at ${expiresAt.toISOString()}`,
    );

    return assignment;
  }

  async extendExpiration(
    userId: string,
    subscriptionEndAt: Date,
  ): Promise<TwilioPhoneNumberAssignmentDocument> {
    const assignment = await this.assignmentModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: TwilioPhoneNumberAssignmentStatus.active,
      })
      .exec();

    if (!assignment) {
      throw new NotFoundException(
        `No active assignment found for user ${userId}`,
      );
    }

    const newExpiresAt = new Date(subscriptionEndAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    assignment.expiresAt = newExpiresAt;
    await assignment.save();

    this.logger.log(
      `Extended expiration for user ${userId} to ${newExpiresAt.toISOString()}`,
    );

    return assignment;
  }

  async scheduleUnbind(userId: string): Promise<void> {
    const assignment = await this.assignmentModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: TwilioPhoneNumberAssignmentStatus.active,
      })
      .exec();

    if (!assignment) {
      this.logger.warn(`No active assignment found for user ${userId}`);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    assignment.expiresAt = expiresAt;
    await assignment.save();

    this.logger.log(
      `Scheduled unbind for user ${userId}, expires at ${expiresAt.toISOString()}`,
    );
  }

  async unbindPhoneNumber(userId: string, assignmentId: string): Promise<void> {
    const assignment = await this.assignmentModel.findById(assignmentId);

    if (!assignment) {
      throw new NotFoundException(`Assignment ${assignmentId} not found`);
    }

    assignment.status = TwilioPhoneNumberAssignmentStatus.expired;
    await assignment.save();

    await this.twilioPhoneNumberService.markAsAvailable(
      assignment.phoneNumberId.toString(),
    );

    this.logger.log(
      `Phone number ${assignment.phoneNumber} unbound from user ${userId}`,
    );
  }

  async getActiveAssignmentByUserId(
    userId: string,
  ): Promise<TwilioPhoneNumberAssignmentDocument | null> {
    return this.assignmentModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: TwilioPhoneNumberAssignmentStatus.active,
      })
      .exec();
  }

  async getAssignmentByPhoneNumber(
    phoneNumber: string,
  ): Promise<TwilioPhoneNumberAssignmentDocument | null> {
    return this.assignmentModel
      .findOne({
        phoneNumber,
        status: TwilioPhoneNumberAssignmentStatus.active,
      })
      .populate('userId')
      .exec();
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<string | null> {
    const assignment = await this.getAssignmentByPhoneNumber(phoneNumber);
    if (!assignment) {
      return null;
    }
    return assignment.userId.toString();
  }
}
