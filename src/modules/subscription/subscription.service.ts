import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  async changePlan(companyId: string, newPlanId: string) {
    const subscription = await this.subscriptionModel.findOne({ companyId, status: 'active' });
    if (!subscription) throw new NotFoundException('Active subscription not found');

    const plan = await this.planModel.findById(newPlanId);
    if (!plan) throw new NotFoundException('Plan not found');

    const stripeSub = await this.stripeService.client.subscriptions.retrieve(subscription.subscriptionId!);
    const subscriptionItemId = stripeSub.items.data[0].id;

    await this.stripeService.client.subscriptions.update(subscription.subscriptionId!, {
      items: [{ id: subscriptionItemId, price: plan.pricing[0].stripePriceId }],
      proration_behavior: 'create_prorations',
      payment_behavior: 'pending_if_incomplete',
    });
  }

  async updatePlanByWebhook(stripeSubscriptionId: string, newPriceId: string) {
    const plan = await this.planModel.findOne({ 'pricing.stripePriceId': newPriceId });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const subscription = await this.subscriptionModel.findOne({ subscriptionId: stripeSubscriptionId });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.planId === plan.id) {
      return;
    }

    await this.subscriptionModel.updateOne(
      { subscriptionId: stripeSubscriptionId },
      { planId: plan.id }
    );
  }

  async activateSubscription(companyId: string, planId: string, subscriptionId: string) {
    const subscription = await this.subscriptionModel.findOne({
      companyId: companyId,
      planId: planId,
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
    subscription.subscriptionId = subscriptionId;

    await subscription.save();

    return {
      message: 'Subscription activated',
    };
  }
}
