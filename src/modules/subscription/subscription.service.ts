import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schema/subscription.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Plan, PlanDocument } from '../plan/schema/plan.schema';
import { StripeService } from '../stripe/stripe.service';
import { RRule } from 'rrule';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
    private readonly stripeService: StripeService,
  ) {}

  async createSubscription(dto: CreateSubscriptionDto) {
    const plan = await this.planModel.findById(dto.planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const pricing = plan.pricing[0];
    if (!pricing || !pricing.stripePriceId) {
      throw new BadRequestException('Missing Stripe price ID in plan pricing.');
    }

    const session = await this.stripeService.createCheckoutSession({
      priceId: pricing.stripePriceId,
      companyId: dto.companyId,
      planId: dto.planId,
    });

    await this.subscriptionModel.create({
      companyId: dto.companyId,
      planId: dto.planId,
      status: 'pending',
    });

    return {
      message: 'Stripe checkout session created',
      checkoutUrl: session.url,
    };
  }

  async cancelSubscription(id: string) {
    const subscription = await this.subscriptionModel.findById(id).populate('planId');
    if (!subscription) throw new NotFoundException('Subscription not found');

    const now = new Date();
    const end = subscription.endAt;

    if (now >= end) {
      subscription.status = 'expired';
      await subscription.save();
      return { message: 'Subscription already expired.' };
    }

    const plan = subscription.planId as any;
    const pricing = plan.pricing[0];
    const price = pricing.price;
    const rrule = RRule.fromString(pricing.rrule);
    const duration = rrule.after(subscription.startAt, true)!.getTime() - subscription.startAt.getTime();
    const used = now.getTime() - subscription.startAt.getTime();
    const unusedRatio = Math.max(0, 1 - used / duration);
    const refundAmount = Math.floor(price * unusedRatio * 100); // cents

    // Refund logic
    if (subscription.paymentIntentId) {
      await this.stripeService.refundPayment(subscription.paymentIntentId, refundAmount);
    }

    subscription.status = 'cancelled';
    subscription.endAt = now;
    await subscription.save();

    return {
      message: 'Subscription cancelled and refund issued',
      refundAmount: refundAmount / 100,
      unusedPercentage: (unusedRatio * 100).toFixed(2) + '%',
    };
  }

  

  async activateSubscription(companyId: string, planId: string, paymentIntentId: string) {
    const subscription = await this.subscriptionModel.findOne({
      companyId,
      planId,
      status: 'pending',
    });

    if (!subscription) {
      throw new NotFoundException('Pending subscription not found');
    }

    const plan = await this.planModel.findById(planId);
    if (!plan || !plan.pricing || plan.pricing.length !== 1) {
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
    if (!endAt) {
      throw new BadRequestException('Could not compute end date from rrule');
    }

    subscription.status = 'active';
    subscription.startAt = now;
    subscription.endAt = endAt;
    subscription.paymentIntentId = paymentIntentId;

    await subscription.save();

    return {
      message: 'Subscription activated',
      subscriptionId: subscription._id,
      validUntil: endAt,
    };
  }
}
