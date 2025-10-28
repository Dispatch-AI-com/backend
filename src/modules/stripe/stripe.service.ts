import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

  get client(): Stripe {
    return this.stripe;
  }

  async createCheckoutSession(input: {
    priceId: string;
    userId: string;
    planId: string;
    stripeCustomerId?: string;
  }): Promise<Stripe.Checkout.Session> {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
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
      return_url: `${process.env.APP_URL ?? 'http://localhost:3000'}/admin/billing`,
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
