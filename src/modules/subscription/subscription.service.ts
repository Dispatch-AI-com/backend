import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RRule } from 'rrule';

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
    });
    return {
      message: 'Subscription activated',
    };
  }

  async changePlan(
    userId: string,
    newPlanId: string,
  ): Promise<{ message: string }> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    if (!subscription)
      throw new NotFoundException('Active subscription not found');

    if (!Types.ObjectId.isValid(newPlanId)) {
      throw new BadRequestException('Invalid plan ID');
    }
    const plan = await this.planModel.findById(newPlanId);

    if (!plan) throw new NotFoundException('Plan not found');

    if (subscription.planId.equals(plan._id)) {
      return { message: 'Already on the target plan' };
    }

    if (subscription.subscriptionId == null) {
      throw new BadRequestException('Missing subscription ID');
    }

    const stripeSub = await this.stripeService.client.subscriptions.retrieve(
      subscription.subscriptionId,
    );

    const subscriptionItemId = stripeSub.items.data[0].id;

    await this.stripeService.client.subscriptions.update(
      subscription.subscriptionId,
      {
        items: [
          { id: subscriptionItemId, price: plan.pricing[0].stripePriceId },
        ],
        proration_behavior: 'create_prorations',
        payment_behavior: 'pending_if_incomplete',
      },
    );

    return { message: 'Plan updated on Stripe' };
  }

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

    if (subscription.planId.equals(plan._id)) {
      return;
    }

    await this.subscriptionModel.updateOne(
      { subscriptionId: stripeSubscriptionId },
      { planId: plan._id },
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
      .findOne({ userId: new Types.ObjectId(userId), status: 'active' })
      .populate('planId')
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

  async downgradeToFree(userId: string): Promise<void> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    if (!subscription)
      throw new NotFoundException('Active subscription not found');

    if (subscription.subscriptionId == null) {
      throw new BadRequestException('Missing subscription ID');
    }

    if (subscription.chargeId == null) {
      throw new BadRequestException('Missing charge ID for refund');
    }

    const stripeSub = await this.stripeService.client.subscriptions.retrieve(
      subscription.subscriptionId,
    );

    const currentPeriodStart =
      stripeSub.items.data[0].current_period_start * 1000;
    const currentPeriodEnd = stripeSub.items.data[0].current_period_end * 1000;
    const now = Date.now();

    const remainingTime = Math.max(currentPeriodEnd - now, 0);
    const totalPeriodTime = currentPeriodEnd - currentPeriodStart;
    const remainingPercentage = remainingTime / totalPeriodTime;

    const invoice = await this.stripeService.client.invoices.retrieve(
      stripeSub.latest_invoice as string,
    );

    const amountPaid = invoice.amount_paid;
    const refundAmount = Math.floor(amountPaid * remainingPercentage);

    if (refundAmount > 0) {
      await this.stripeService.refundPayment(
        subscription.chargeId,
        refundAmount,
      );
    }

    await this.stripeService.client.subscriptions.cancel(
      subscription.subscriptionId,
    );

    await this.subscriptionModel.updateOne(
      { subscriptionId: subscription.subscriptionId },
      { status: 'cancelled' },
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
}
