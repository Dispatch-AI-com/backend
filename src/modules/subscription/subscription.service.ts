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
    const subscription = await this.subscriptionModel.findById(id);
    if (!subscription) throw new NotFoundException('Subscription not found');

    if (subscription.status !== 'active') {
      throw new BadRequestException('Only active subscriptions can be cancelled');
    }

    subscription.status = 'cancelled';
    await subscription.save();

    return {
      message: 'Subscription cancelled successfully',
      id: subscription._id,
    };
  }

  async activateSubscription(companyId: string, planId: string) {
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

    await subscription.save();

    return {
      message: 'Subscription activated',
      subscriptionId: subscription._id,
      validUntil: endAt,
    };
  }
}
