import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

import { getAppUrl } from '@/utils/app-config';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY ?? '';
    if (stripeKey === '') {
      // In development, allow service to start without Stripe credentials
      if (
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === undefined
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          '⚠️  Stripe credentials not found. Stripe features will be disabled.',
        );
        // Use a dummy key for development (Stripe SDK requires a non-empty string)
        this.stripe = new Stripe('sk_test_development_dummy_key_1234567890', {
          apiVersion: '2025-08-27.basil',
        });
      } else {
        throw new Error(
          'Stripe credentials not found in environment variables',
        );
      }
    } else {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-08-27.basil',
      });
    }
  }

  get client(): Stripe {
    return this.stripe;
  }

  async createCheckoutSession(input: {
    priceId: string;
    userId: string;
    planId: string;
    stripeCustomerId?: string;
  }): Promise<Stripe.Checkout.Session> {
    const appUrl = getAppUrl();
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: `${appUrl}/admin/billing?status=success`,
      cancel_url: `${appUrl}/admin/billing?status=failed`,
      ...(input.stripeCustomerId != null
        ? { customer: input.stripeCustomerId }
        : {}),
      subscription_data: {
        metadata: { userId: input.userId, planId: input.planId },
      },
    });

    return session;
  }

  async retrieveSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async refundPayment(
    chargeId: string,
    amount: number,
  ): Promise<Stripe.Response<Stripe.Refund>> {
    return this.stripe.refunds.create({
      charge: chargeId,
      amount,
    });
  }

  async createBillingPortalSession(stripeCustomerId: string): Promise<string> {
    const session = await this.client.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: getAppUrl(),
    });

    return session.url;
  }

  async retrievecharge(customerId: string): Promise<string | null> {
    const charges = await this.stripe.charges.list({
      customer: customerId,
      limit: 10,
    });

    const charge = charges.data.find(c => c.paid && !c.refunded);
    return charge?.id ?? null;
  }

  async listInvoicesByCustomerId(
    stripeCustomerId: string,
    limit = 10,
  ): Promise<Stripe.Invoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: stripeCustomerId,
      limit,
      expand: ['data.charge'],
    });

    return invoices.data;
  }

  async listRefundsByChargeId(chargeId: string): Promise<Stripe.Refund[]> {
    const refundList = await this.stripe.refunds.list({
      charge: chargeId,
      limit: 10,
    });

    return refundList.data;
  }

  constructWebhookEvent(body: Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
    return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
  }
}
