import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

  get client(): Stripe {
    return this.stripe;
  }

  async createCheckoutSession(input: {
    priceId: string;
    companyId: string;
    planId: string;
  }) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: `${appUrl}/pricing`,
      cancel_url: `${appUrl}/pricing`,
      subscription_data: {
        metadata: { companyId: input.companyId, planId: input.planId },
      },
    });

    return session;
  }

  async retrieveSubscription(subscriptionId: string) {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async refundPayment(chargeId: string, amount: number) {
    return this.stripe.refunds.create({
      charge: chargeId,
      amount,
    });
  }

  async createBillingPortalSession(stripeCustomerId: string) {
    const session = await this.client.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: process.env.APP_URL || 'http://localhost:3000',
    });

    return session.url;
  }

  async retrievecharge(customerId: string) {
    const charges = await this.stripe.charges.list({
      customer: customerId,
      limit: 10,
    });

    const charge = charges.data.find(c => c.paid && !c.refunded);
    const chargeId = charge?.id;
    return chargeId || null;
  }

  constructWebhookEvent(body: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
  }
}
