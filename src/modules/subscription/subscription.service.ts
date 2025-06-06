import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schema/subscription.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Plan, PlanDocument } from '../plan/schema/plan.schema';
import { Company, CompanyDocument } from '../company/schema/company.schema';
import { StripeService } from '../stripe/stripe.service';
import { RRule } from 'rrule';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    private readonly stripeService: StripeService,
  ) {}

  async createSubscription(dto: CreateSubscriptionDto) {
    const company = await this.companyModel.findById(dto.companyId);
    if (!company) throw new NotFoundException('Company not found');
    
    const plan = await this.planModel.findById(dto.planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const pricing = plan.pricing[0];
    if (!pricing?.stripePriceId) {
      throw new BadRequestException('Missing Stripe price ID');
    }

    const session = await this.stripeService.createCheckoutSession({
      priceId: pricing.stripePriceId,
      companyId: dto.companyId,
      planId: dto.planId,
    });

    return {
      message: 'Stripe checkout session created',
      checkoutUrl: session.url,
    };
  }

  async activateSubscription(companyId: string, planId: string, subscriptionId: string) {
    const company = await this.companyModel.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const plan = await this.planModel.findById(planId);
    if (!plan || !plan.pricing) {
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

    await this.subscriptionModel.create({
      companyId: new Types.ObjectId(companyId),
      planId: new Types.ObjectId(planId),
      subscriptionId: subscriptionId,
      createdAt: now,
      status: 'active',
      startAt: now,
      endAt: endAt,
    });
    return {
      message: 'Subscription activated',
    };
  }

  async changePlan(companyId: string, newPlanId: string) {
    const subscription = await this.subscriptionModel.findOne({
      companyId: new Types.ObjectId(companyId),
      status: 'active',
    });
    if (!subscription) throw new NotFoundException('Active subscription not found');

    const plan = await this.planModel.findById(newPlanId);
    if (!plan) throw new NotFoundException('Plan not found');

    if (subscription.planId === plan.id) {
      return { message: 'Already on the target plan' };
    }

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
    if (!plan) throw new NotFoundException('Plan not found');

    const subscription = await this.subscriptionModel.findOne({ subscriptionId: stripeSubscriptionId });
    if (!subscription) throw new NotFoundException('Subscription not found');

    if (subscription.planId === plan.id) {
      return;
    }

    await this.subscriptionModel.updateOne(
      { subscriptionId: stripeSubscriptionId },
      { planId: plan.id }
    );
  }

  async updateStatusByWebhook(subscriptionId: string, status: string) {
    const subscription = await this.subscriptionModel.findOne({ subscriptionId: subscriptionId });
    if (!subscription) throw new NotFoundException('Subscription not found');

    if (subscription.status === status) {
      return; 
    }

    await this.subscriptionModel.updateOne(
      { subscriptionId },
      { status: status }
    );
  }

  async getByCompany(companyId: string) {
    const subscription = await this.subscriptionModel
      .findOne({ companyId: new Types.ObjectId(companyId) })
      .populate('planId')
      .populate('companyId');

    if (!subscription) throw new NotFoundException('Subscription not found for company');
    return subscription;
  }

  async getAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return await this.subscriptionModel
      .find()
      .populate('planId')
      .populate('companyId')
      .skip(skip)
      .limit(limit);
  }
}
