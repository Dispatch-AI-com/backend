import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schema/subscription.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Plan, PlanDocument } from '../plan/schema/plan.schema';
import { RRule } from 'rrule';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
  ) {}

  async createSubscriptionWithoutStripe(dto: CreateSubscriptionDto) {
    const plan = await this.planModel.findById(dto.planId);
    if (!plan) throw new NotFoundException('Plan not found');

    if (!plan.pricing || plan.pricing.length !== 1) {
      throw new BadRequestException('Plan must have exactly one pricing rule.');
    }

    const pricing = plan.pricing[0];

    const now = new Date();

    let rule: RRule;
    try {
      rule = RRule.fromString(pricing.rrule);
    } catch (e) {
      throw new BadRequestException('Invalid rrule format in plan.');
    }

    const nextOccurrence = rule.after(now);
    if (!nextOccurrence) {
      throw new BadRequestException('Unable to compute billing cycle end date from rrule.');
    }

    const subscription = await this.subscriptionModel.create({
      companyId: dto.companyId,
      planId: plan._id,
      startAt: now,
      endAt: nextOccurrence,
      status: 'active',
    });

    return {
      message: 'Subscription created successfully',
      subscriptionId: subscription._id,
      validUntil: nextOccurrence,
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

  async getActiveSubscription(companyId: string) {
    const sub = await this.subscriptionModel.findOne({ companyId }).populate('planId');

    if (!sub) return null;

    const now = new Date();
    if (sub.status === 'active' && sub.endAt < now) {
      sub.status = 'expired';
      await sub.save();
    }

    return sub;
  }
}
