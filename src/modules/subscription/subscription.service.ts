import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RRule } from 'rrule';

import { Company, CompanyDocument } from '../company/schema/company.schema';
import { Plan, PlanDocument } from '../plan/schema/plan.schema';
import { StripeService } from '../stripe/stripe.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  Subscription,
  SubscriptionDocument,
} from './schema/subscription.schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    private readonly stripeService: StripeService,
  ) {}

  async createSubscription(dto: CreateSubscriptionDto) {
    if (!Types.ObjectId.isValid(dto.companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    const company = await this.companyModel.findById(dto.companyId);
    if (!company) throw new NotFoundException('Company not found');

    if (!Types.ObjectId.isValid(dto.planId)) {
      throw new BadRequestException('Invalid plan ID');
    }
    const plan = await this.planModel.findById(dto.planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const pricing = plan.pricing[0];

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

  async activateSubscription(
    companyId: string,
    planId: string,
    subscriptionId: string,
    stripeCustomerId: string,
    chargeId: string,
  ) {
    const company = await this.companyModel.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');

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
    if (!endAt) {
      throw new BadRequestException('Could not compute end date from rrule');
    }

    await this.subscriptionModel.create({
      companyId: new Types.ObjectId(companyId),
      planId: new Types.ObjectId(planId),
      subscriptionId: subscriptionId,
      stripeCustomerId: stripeCustomerId,
      chargeId: chargeId,
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
    if (!subscription)
      throw new NotFoundException('Active subscription not found');

    if (!Types.ObjectId.isValid(newPlanId)) {
      throw new BadRequestException('Invalid plan ID');
    }
    const plan = await this.planModel.findById(newPlanId);

    if (!plan) throw new NotFoundException('Plan not found');

    if (subscription.planId === plan.id) {
      return { message: 'Already on the target plan' };
    }

    if (!subscription.subscriptionId) {
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
  }

  async updatePlanByWebhook(stripeSubscriptionId: string, newPriceId: string) {
    const plan = await this.planModel.findOne({
      'pricing.stripePriceId': newPriceId,
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const subscription = await this.subscriptionModel.findOne({
      subscriptionId: stripeSubscriptionId,
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    if (subscription.planId === plan.id) {
      return;
    }

    await this.subscriptionModel.updateOne(
      { subscriptionId: stripeSubscriptionId },
      { planId: plan.id },
    );
  }

  async updateStatusByWebhook(subscriptionId: string, status: string) {
    const subscription = await this.subscriptionModel.findOne({
      subscriptionId: subscriptionId,
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    if (subscription.status === status) {
      return;
    }

    await this.subscriptionModel.updateOne(
      { subscriptionId },
      { status: status },
    );
  }

  async updateChargeIdByWebhook(customerId: string, chargeId: string) {
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
      { chargeId: chargeId },
    );
  }

  async getByCompany(companyId: string) {
    const subscription = await this.subscriptionModel
      .findOne({ companyId: new Types.ObjectId(companyId) })
      .populate('planId')
      .populate('companyId');

    if (!subscription)
      throw new NotFoundException('Subscription not found for company');
    return subscription;
  }

  async getAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return await this.subscriptionModel
      .find()
      .populate('planId')
      .populate('companyId')
      .skip(skip)
      .limit(limit);
  }

  async generateBillingPortalUrl(companyId: string) {
    const subscription = await this.subscriptionModel.findOne({
      companyId: new Types.ObjectId(companyId),
      status: 'failed',
    });

    if (!subscription) {
      throw new NotFoundException(
        'No failed subscription found for this company',
      );
    }

    const stripeCustomerId = subscription.stripeCustomerId;

    if (!stripeCustomerId) {
      throw new BadRequestException('Missing stripe customer id');
    }

    return await this.stripeService.createBillingPortalSession(
      stripeCustomerId,
    );
  }

  async findBySuscriptionId(subscriptionId: string) {
    return await this.subscriptionModel.findOne({ subscriptionId });
  }

  async downgradeToFree(companyId: string) {
    const subscription = await this.subscriptionModel.findOne({
      companyId: new Types.ObjectId(companyId),
      status: 'active',
    });

    if (!subscription)
      throw new NotFoundException('Active subscription not found');

    if (!subscription.subscriptionId) {
      throw new BadRequestException('Missing subscription ID');
    }

    if (!subscription.chargeId) {
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
}
