import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// import { Cron, CronExpression } from '@nestjs/schedule'; // Disabled: using webhook-based reset
import { Model, Types } from 'mongoose';
import { RRule } from 'rrule';
import Stripe from 'stripe';

import { Plan, PlanDocument } from '../plan/schema/plan.schema';
import { StripeService } from '../stripe/stripe.service';
import { User, UserDocument } from '../user/schema/user.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  Subscription,
  SubscriptionDocument,
} from './schema/subscription.schema';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
    @InjectModel(User.name)
    private readonly UserModel: Model<UserDocument>,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Extract numeric value from callMinutes string
   * Handles formats like: "100 Min/Month", "100", 100, "Unlimited", null, undefined
   * @param callMinutes - The call minutes value from plan features
   * @returns The numeric value in minutes, or 0 if invalid
   */
  private extractMinutesFromCallMinutes(callMinutes: string | number | null | undefined): number {
    if (callMinutes == null) {
      return 0;
    }

    // If it's already a number, return it
    if (typeof callMinutes === 'number') {
      return callMinutes;
    }

    // If it's a string, extract the numeric part
    const match = callMinutes.toString().match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    // If no number found (e.g., "Unlimited"), return 0
    return 0;
  }

  /**
   * Fallback mechanism for resetting subscription cycles
   * Primary method is webhook-based (invoice.payment_succeeded)
   * 
   * @deprecated Cron is disabled - kept for reference/emergency use only
   * To enable: uncomment @Cron decorator below
   */
  // @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async resetIfMonthlyDue(): Promise<void> {
    const now = new Date();
    this.logger.log('resetIfMonthlyDue() start');

    const dueSubs = await this.subscriptionModel
      .find({
        status: 'active',
        endAt: { $lte: now },
      })
      .lean();

    for (const sub of dueSubs) {
      try {
        const plan = await this.planModel.findById(sub.planId).lean();
        const r = plan?.pricing[0]?.rrule;
        if (!plan || r == null || r.trim() === '') {
          this.logger.warn(`no plan or rrule`);
          continue;
        }

        let rule: RRule;
        try {
          rule = RRule.fromString(r);
        } catch {
          this.logger.error(`bad rrule plan=${plan._id.toString()}`);
          continue;
        }

        let newStart = sub.endAt;
        let newEnd = rule.after(newStart);
        if (!newEnd) {
          this.logger.error(`no next endAt`);
          continue;
        }
        while (newEnd <= now) {
          newStart = newEnd;
          const n = rule.after(newStart);
          if (!n) break;
          newEnd = n;
        }

        const minutes = this.extractMinutesFromCallMinutes(plan.features.callMinutes);
        const gran = sub.billGranularitySec;

        await this.subscriptionModel.updateOne(
          { _id: sub._id },
          {
            $set: {
              startAt: newStart,
              endAt: newEnd,
              secondsLeft: minutes * 60,
              billGranularitySec: gran,
              updatedAt: new Date(),
            },
          },
        );

        this.logger.log(`reset success`);
      } catch (e) {
        this.logger.error(
          `reset error: ${e instanceof Error ? e.message : String(e)}`,
          e instanceof Error ? e : new Error(String(e)),
        );
      }
    }

    this.logger.log(`reset success`);
  }

  async createSubscription(dto: CreateSubscriptionDto): Promise<{
    message: string;
    checkoutUrl: string;
  }> {
    if (!Types.ObjectId.isValid(dto.userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const user = await this.UserModel.findById(dto.userId);
    if (!user) throw new NotFoundException('User not found');

    if (!Types.ObjectId.isValid(dto.planId)) {
      throw new BadRequestException('Invalid plan ID');
    }
    const plan = await this.planModel.findById(dto.planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const pricing = plan.pricing[0];

    const lastSubscription = await this.subscriptionModel
      .findOne({
        userId: new Types.ObjectId(dto.userId),
        stripeCustomerId: { $exists: true },
      })
      .sort({ createdAt: -1 });

    const existingStripeCustomerId = lastSubscription?.stripeCustomerId;

    const session = await this.stripeService.createCheckoutSession({
      priceId: pricing.stripePriceId,
      userId: dto.userId,
      planId: dto.planId,
      stripeCustomerId: existingStripeCustomerId,
    });

    return {
      message: 'Stripe checkout session created',
      checkoutUrl: session.url ?? '',
    };
  }

  async activateSubscription(
    userId: string,
    planId: string,
    subscriptionId: string,
    stripeCustomerId: string,
    chargeId: string,
  ): Promise<{ message: string }> {
    const user = await this.UserModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.planModel.findById(planId);
    if (!plan) {
      throw new BadRequestException('Plan is invalid or misconfigured');
    }

    const pricing = plan.pricing[0];
    let rule: RRule;
    try {
      rule = RRule.fromString(pricing.rrule);
    } catch {
      throw new BadRequestException('Invalid rrule in plan');
    }

    const now = new Date();
    const endAt = rule.after(now);
    if (endAt == null) {
      throw new BadRequestException('Could not compute end date from rrule');
    }

    const includedMinutes = this.extractMinutesFromCallMinutes(plan.features.callMinutes);
    const billGranularitySec = 60;

    await this.subscriptionModel.create({
      userId: new Types.ObjectId(userId),
      planId: new Types.ObjectId(planId),
      subscriptionId,
      stripeCustomerId,
      chargeId,
      createdAt: now,
      status: 'active',
      startAt: now,
      endAt,
      secondsLeft: includedMinutes * 60,
      billGranularitySec,
    });

    return {
      message: 'Subscription activated',
    };
  }

  /**
   * Change subscription plan
   * - Upgrade: Takes effect immediately with prorated charges
   * - Downgrade: Takes effect at next billing cycle
   * Also handles pending_cancellation status by canceling the cancellation
   */
  async changePlan(
    userId: string,
    newPlanId: string,
  ): Promise<{ message: string }> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: ['active', 'pending_cancellation', 'pending_downgrade'] },
    });
    if (!subscription)
      throw new NotFoundException('Active subscription not found');

    if (!Types.ObjectId.isValid(newPlanId)) {
      throw new BadRequestException('Invalid plan ID');
    }
    const newPlan = await this.planModel.findById(newPlanId);

    if (!newPlan) throw new NotFoundException('Plan not found');

    // Special case: If trying to switch to current plan while pending_downgrade, cancel the downgrade
    if (subscription.planId.equals(newPlan._id)) {
      if (subscription.status === 'pending_downgrade') {
        this.logger.log(
          `🔄 Canceling scheduled downgrade for subscription: ${subscription.subscriptionId}`,
        );
        
        if (!subscription.subscriptionId) {
          throw new BadRequestException('Missing subscription ID');
        }
        
        // Get current Stripe subscription to cancel the scheduled price change
        const stripeSub = await this.stripeService.client.subscriptions.retrieve(
          subscription.subscriptionId,
        );
        
        // Get the current plan's price ID from our database (not from Stripe)
        const currentPlan = await this.planModel.findById(subscription.planId);
        if (!currentPlan) {
          throw new BadRequestException('Current plan not found');
        }
        
        // Cancel the scheduled price change by reverting to current plan's price
        const subscriptionItemId = stripeSub.items.data[0].id;
        const currentPriceId = currentPlan.pricing[0].stripePriceId;
        
        await this.stripeService.client.subscriptions.update(
          subscription.subscriptionId,
          {
            items: [{ id: subscriptionItemId, price: currentPriceId }],
            proration_behavior: 'none', // No proration when canceling downgrade
            billing_cycle_anchor: 'unchanged',
          },
        );
        
        // Clear pending downgrade: set status back to active and clear pendingPlanId
        await this.subscriptionModel.updateOne(
          { subscriptionId: subscription.subscriptionId },
          {
            $set: { status: 'active' },
            $unset: { pendingPlanId: '' },  // Clear the pending plan
          },
        );
        
        this.logger.log(
          `✅ Subscription ${subscription.subscriptionId} scheduled downgrade canceled, Stripe price reverted to current plan`,
        );
        
        return { message: 'Downgrade canceled successfully' };
      }
      return { message: 'Already on the target plan' };
    }

    if (subscription.subscriptionId == null) {
      throw new BadRequestException('Missing subscription ID');
    }

    // Get current plan to compare
    const currentPlan = await this.planModel.findById(subscription.planId);
    if (!currentPlan) {
      throw new BadRequestException('Current plan not found');
    }

    // Extract call minutes for comparison
    const currentMinutes = this.extractMinutesFromCallMinutes(currentPlan.features.callMinutes);
    const newMinutes = this.extractMinutesFromCallMinutes(newPlan.features.callMinutes);
    const isUpgrade = newMinutes > currentMinutes;

    const stripeSub = await this.stripeService.client.subscriptions.retrieve(
      subscription.subscriptionId,
    );

    const subscriptionItemId = stripeSub.items.data[0].id;

    // Step 1: Handle pending cancellation (pending_downgrade is handled above)
    if (subscription.status === 'pending_cancellation') {
      this.logger.log(
        `🔄 Canceling scheduled cancellation for subscription: ${subscription.subscriptionId}`,
      );
      
      await this.stripeService.client.subscriptions.update(
        subscription.subscriptionId,
        {
          cancel_at_period_end: false,
        },
      );

      // Update status back to active
      await this.subscriptionModel.updateOne(
        { subscriptionId: subscription.subscriptionId },
        { status: 'active' },
      );
      
      this.logger.log(
        `✅ Subscription ${subscription.subscriptionId} cancellation canceled and status restored to active`,
      );
    }

    // Step 2: Update the subscription plan
    if (isUpgrade) {
      // Upgrade: Immediate effect with proration
      this.logger.log(
        `⬆️ Upgrading subscription ${subscription.subscriptionId}: ${currentMinutes} → ${newMinutes} minutes`,
      );

      await this.stripeService.client.subscriptions.update(
        subscription.subscriptionId,
        {
          items: [
            { id: subscriptionItemId, price: newPlan.pricing[0].stripePriceId },
          ],
          proration_behavior: 'create_prorations',
          payment_behavior: 'pending_if_incomplete',
        },
      );

      // Immediately update call minutes in database
      const newSecondsLeft = newMinutes * 60;
      await this.subscriptionModel.updateOne(
        { subscriptionId: subscription.subscriptionId },
        {
          $set: {
            planId: newPlan._id,
            secondsLeft: newSecondsLeft,
            updatedAt: new Date(),
          },
        },
      );

      this.logger.log(
        `✅ Upgrade completed: secondsLeft updated to ${newMinutes} minutes immediately`,
      );
    } else {
      // Downgrade: Takes effect at next billing cycle
      this.logger.log(
        `⬇️ Downgrading subscription ${subscription.subscriptionId}: ${currentMinutes} → ${newMinutes} minutes (next cycle)`,
      );

      await this.stripeService.client.subscriptions.update(
        subscription.subscriptionId,
        {
          items: [
            { id: subscriptionItemId, price: newPlan.pricing[0].stripePriceId },
          ],
          proration_behavior: 'none',
          billing_cycle_anchor: 'unchanged',
          payment_behavior: 'pending_if_incomplete',
        },
      );

      // Don't update planId or call minutes immediately for downgrades
      // Keep current planId, set pendingPlanId, and change status to pending_downgrade
      await this.subscriptionModel.updateOne(
        { subscriptionId: subscription.subscriptionId },
        {
          $set: {
            pendingPlanId: newPlan._id,  // Track the pending downgrade plan
            status: 'pending_downgrade',
            updatedAt: new Date(),
          },
        },
      );

      this.logger.log(
        `✅ Downgrade scheduled: pendingPlanId set to ${newPlan.tier}, status set to pending_downgrade, will take effect at next billing cycle, current ${currentMinutes} minutes maintained`,
      );
    }

    return { message: `Plan ${isUpgrade ? 'upgraded' : 'downgraded'} successfully` };
  }

  /**
   * Update plan by webhook (triggered by Stripe subscription.updated event)
   * This is called when a plan change takes effect (e.g., downgrade at next cycle)
   * 
   * IMPORTANT: Do NOT update planId/secondsLeft if subscription is pending_downgrade
   * because that means the downgrade hasn't taken effect yet (scheduled for next cycle)
   */
  async updatePlanByWebhook(
    stripeSubscriptionId: string,
    newPriceId: string,
  ): Promise<void> {
    const plan = await this.planModel.findOne({
      'pricing.stripePriceId': newPriceId,
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const subscription = await this.subscriptionModel.findOne({
      subscriptionId: stripeSubscriptionId,
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    // If subscription is pending_downgrade, don't update planId/secondsLeft
    // The change will be applied when the new billing cycle starts
    if (subscription.status === 'pending_downgrade') {
      this.logger.log(
        `⏸️ Subscription ${stripeSubscriptionId} is pending_downgrade, skipping webhook plan update (will update on next cycle)`,
      );
      return;
    }

    if (subscription.planId.equals(plan._id)) {
      // Plan already matches
      return;
    }

    // Extract call minutes from the new plan
    const newMinutes = this.extractMinutesFromCallMinutes(plan.features.callMinutes);
    const newSecondsLeft = newMinutes * 60;

    // Update both planId and secondsLeft
    // This typically happens when an upgrade takes effect immediately
    await this.subscriptionModel.updateOne(
      { subscriptionId: stripeSubscriptionId },
      {
        $set: {
          planId: plan._id,
          secondsLeft: newSecondsLeft,
          updatedAt: new Date(),
        },
      },
    );

    this.logger.log(
      `✅ Plan updated via webhook for ${stripeSubscriptionId}: ${newMinutes} minutes`,
    );
  }

  async updateStatusByWebhook(
    subscriptionId: string,
    status: string,
  ): Promise<void> {
    const subscription = await this.subscriptionModel.findOne({
      subscriptionId,
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    if (subscription.status === status) {
      return;
    }

    await this.subscriptionModel.updateOne({ subscriptionId }, { status });
  }

  /**
   * Suspend subscription by setting secondsLeft to 0
   * Used when payment fails to prevent service usage
   */
  async suspendSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionModel.findOne({
      subscriptionId,
    });

    if (!subscription) {
      this.logger.warn(
        `No subscription found for subscriptionId: ${subscriptionId}`,
      );
      return;
    }

    await this.subscriptionModel.updateOne(
      { subscriptionId },
      {
        $set: {
          secondsLeft: 0,
          updatedAt: new Date(),
        },
      },
    );

    this.logger.log(
      `⏸️ Subscription suspended (secondsLeft set to 0) for ${subscriptionId}`,
    );
  }

  async updateChargeIdByWebhook(
    customerId: string,
    chargeId: string,
  ): Promise<void> {
    const subscription = await this.subscriptionModel.findOne({
      stripeCustomerId: customerId,
    });
    if (!subscription)
      throw new NotFoundException('Subscription not found for this customer');

    if (subscription.chargeId === chargeId) {
      return;
    }

    await this.subscriptionModel.updateOne(
      { stripeCustomerId: customerId },
      { chargeId },
    );
  }

  async getActiveByuser(userId: string): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel
      .findOne({ 
        userId: new Types.ObjectId(userId), 
        status: { $in: ['active', 'pending_cancellation', 'pending_downgrade', 'failed'] }
      })
      .populate('planId')
      .populate('pendingPlanId') 
      .populate('userId');

    if (!subscription)
      throw new NotFoundException('Active Subscription not found for user');
    return subscription;
  }

  async getAll(page = 1, limit = 20): Promise<SubscriptionDocument[]> {
    const skip = (page - 1) * limit;
    return this.subscriptionModel
      .find()
      .populate('planId')
      .populate('userId')
      .skip(skip)
      .limit(limit);
  }

  async generateBillingPortalUrl(userId: string): Promise<string> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'failed',
    });

    if (!subscription) {
      throw new NotFoundException('No failed subscription found for this user');
    }

    const stripeCustomerId = subscription.stripeCustomerId;
    if (stripeCustomerId == null) {
      throw new BadRequestException('Missing stripe customer id');
    }

    return await this.stripeService.createBillingPortalSession(
      stripeCustomerId,
    );
  }

  async findBySuscriptionId(
    subscriptionId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ subscriptionId });
  }

  /**
   * Reset subscription cycle using Stripe's period information
   * This is triggered by Stripe's invoice.payment_succeeded webhook
   * for recurring payments (not initial subscription)
   * 
   * @param subscriptionId - Stripe subscription ID
   * @param periodStart - Unix timestamp (seconds) from Stripe
   * @param periodEnd - Unix timestamp (seconds) from Stripe
   */
  async resetSubscriptionCycleWithPeriod(
    subscriptionId: string,
    periodStart: number,
    periodEnd: number,
  ): Promise<void> {
    const subscription = await this.subscriptionModel.findOne({
      subscriptionId,
      status: { $in: ['active', 'pending_downgrade', 'pending_cancellation', 'cancelled'] },
    });

    if (!subscription) {
      this.logger.warn(
        `No active, pending_downgrade, pending_cancellation, or cancelled subscription found for subscriptionId: ${subscriptionId}`,
      );
      return;
    }

    // For pending_downgrade, use pendingPlanId; otherwise use current planId
    const targetPlanId = subscription.status === 'pending_downgrade' && subscription.pendingPlanId != null
      ? subscription.pendingPlanId
      : subscription.planId;

    // Debug logging for downgrade
    if (subscription.status === 'pending_downgrade') {
      this.logger.log(
        `🔍 Downgrade debug for ${subscriptionId}: status=${subscription.status}, currentPlanId=${subscription.planId}, pendingPlanId=${subscription.pendingPlanId}, targetPlanId=${targetPlanId}`,
      );
    }

    const plan = await this.planModel.findById(targetPlanId).lean();
    if (!plan) {
      this.logger.error(
        `Plan not found for subscription: ${subscriptionId}, planId: ${targetPlanId}`,
      );
      return;
    }

    // Convert Unix timestamps (seconds) to Date objects
    const startAt = new Date(periodStart * 1000);
    const endAt = new Date(periodEnd * 1000);

    // Reset call minutes based on plan
    const minutes = this.extractMinutesFromCallMinutes(plan.features.callMinutes);
    const secondsLeft = minutes * 60;

    // Prepare update data
    const updateData: any = {
      startAt,
      endAt,
      secondsLeft,
      updatedAt: new Date(),
    };

    // Handle different subscription statuses
    if (subscription.status === 'pending_downgrade') {
      // Downgrade has now taken effect
      updateData.status = 'active';
      updateData.planId = targetPlanId;  // Update planId to the pending plan
      this.logger.log(
        `🔄 Downgrade now effective for ${subscriptionId}: planId updated from ${subscription.planId} to ${targetPlanId}, status changed to active`,
      );
    } else if (subscription.status === 'pending_cancellation') {
      // Keep pending_cancellation status - user will be cancelled at period end
      // Only update cycle dates and minutes, don't change status
      this.logger.log(
        `⏰ Subscription ${subscriptionId} cycle reset while pending cancellation - status remains pending_cancellation`,
      );
    } else if (subscription.status === 'cancelled') {
      // Keep cancelled status - subscription was already cancelled by subscription.deleted webhook
      // Only update cycle dates and minutes, don't change status
      this.logger.log(
        `🚫 Subscription ${subscriptionId} cycle reset while cancelled - status remains cancelled (payment succeeded after deletion)`,
      );
    }
    // For 'active' status, no additional changes needed

    const updateOperations: any = { $set: updateData };
    
    // Clear pendingPlanId if it was a downgrade
    if (subscription.status === 'pending_downgrade' && subscription.pendingPlanId) {
      updateOperations.$unset = { pendingPlanId: '' };
    }

    await this.subscriptionModel.updateOne(
      { subscriptionId },
      updateOperations,
    );

    this.logger.log(
      `✅ Subscription cycle reset for ${subscriptionId}: ${startAt.toISOString()} - ${endAt.toISOString()}, ${minutes} minutes restored`,
    );
  }

 
  /**
   * Schedule subscription cancellation at period end
   * User can continue using service until current period ends
   * Status changes: 
   * - active → pending_cancellation → cancelled (via webhook)
   * - pending_downgrade → pending_cancellation → cancelled (via webhook)
   * - failed → cancelled (immediate cancellation)
   */
  async downgradeToFree(userId: string): Promise<void> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: ['active', 'pending_downgrade', 'failed'] },
    });

    if (!subscription)
      throw new NotFoundException('Active, pending_downgrade, or failed subscription not found');

    if (subscription.subscriptionId == null) {
      throw new BadRequestException('Missing subscription ID');
    }

    // Handle failed subscription - cancel immediately
    if (subscription.status === 'failed') {
      this.logger.log(
        `🚫 Canceling failed subscription immediately: ${subscription.subscriptionId}`,
      );
      
      // Cancel the subscription immediately on Stripe
      await this.stripeService.client.subscriptions.cancel(
        subscription.subscriptionId,
      );

      // Update subscription status to cancelled in database
      await this.subscriptionModel.updateOne(
        { subscriptionId: subscription.subscriptionId },
        { 
          status: 'cancelled',
          secondsLeft: 0, // Suspend service immediately
        },
      );

      this.logger.log(
        `✅ Failed subscription cancelled immediately for user ${userId}, subscriptionId: ${subscription.subscriptionId}`,
      );
      return;
    }

    // If subscription is pending_downgrade, we need to cancel the scheduled downgrade first
    // by retrieving current subscription details
    if (subscription.status === 'pending_downgrade') {
      this.logger.log(
        `🔄 Canceling scheduled downgrade for subscription: ${subscription.subscriptionId}`,
      );
      
      // Stripe will handle the scheduled change when we set cancel_at_period_end
      // The scheduled price change will be discarded
      this.logger.log(
        `✅ Scheduled downgrade will be replaced by cancellation for ${subscription.subscriptionId}`,
      );
    }

    // Set cancel_at_period_end on Stripe
    // This will override any scheduled plan changes
    await this.stripeService.client.subscriptions.update(
      subscription.subscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    // Update subscription status in database
    await this.subscriptionModel.updateOne(
      { subscriptionId: subscription.subscriptionId },
      { status: 'pending_cancellation' },
    );

    this.logger.log(
      `⏳ Subscription scheduled for cancellation at period end for user ${userId}, subscriptionId: ${subscription.subscriptionId}`,
    );
  }

  async deleteById(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ObjectId format');
    }

    const deleted = await this.subscriptionModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Subscription not found');
    }
  }

  async getInvoicesByUser(userId: string): Promise<Stripe.Invoice[]> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      stripeCustomerId: { $exists: true },
    });

    if (
      subscription?.stripeCustomerId == null ||
      subscription.stripeCustomerId === ''
    ) {
      throw new NotFoundException('Stripe customer not found for this user');
    }

    return this.stripeService.listInvoicesByCustomerId(
      subscription.stripeCustomerId,
    );
  }

  async getRefundsByUserId(userId: string): Promise<Stripe.Refund[]> {
    const subscriptions = await this.subscriptionModel.find({
      userId: new Types.ObjectId(userId),
      chargeId: { $exists: true, $ne: null },
    });

    const refunds: Stripe.Refund[] = [];

    for (const sub of subscriptions) {
      const chargeId = sub.chargeId;
      if (typeof chargeId === 'string') {
        const chargeRefunds =
          await this.stripeService.listRefundsByChargeId(chargeId);
        refunds.push(...chargeRefunds);
      }
    }

    return refunds;
  }

  async finalizeUsageByUserId(
    userId: string,
    rawDurationSec: number,
  ): Promise<void> {
    const sub = await this.subscriptionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      })
      .lean();

    if (!sub) throw new NotFoundException('Active subscription not found');
    const gran = sub.billGranularitySec || 60;
    const billedSec = Math.ceil(rawDurationSec / gran) * gran;

    await this.subscriptionModel.updateOne({ _id: sub._id }, [
      {
        $set: {
          secondsLeft: {
            $max: [{ $subtract: ['$secondsLeft', billedSec] }, 0],
          },
          updatedAt: new Date(),
        },
      },
    ]);
  }
}
