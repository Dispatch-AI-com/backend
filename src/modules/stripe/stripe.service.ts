import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-04-30.basil',
  });

  async createCheckoutSession(input: {
    priceId: string;
    companyId: string;
    planId: string;
  }) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/pricing/cancel`,
      metadata: {
        companyId: input.companyId,
        planId: input.planId,
      },
    });

    return session;
  }

  async getPaymentIntentFromSession(session: Stripe.Checkout.Session): Promise<string> {
    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      throw new Error('No subscription ID found in session');
    }

    // 获取 Subscription
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId) as any;

    const invoiceId = subscription.latest_invoice as string;
    if (!invoiceId) {
      throw new Error('No latest invoice found in subscription');
    }

    // ⚠️ 使用 `as any` 绕过类型限制
    const invoice = await this.stripe.invoices.retrieve(invoiceId) as any;

    const paymentIntentId = invoice.payment_intent;
    if (!paymentIntentId) {
      throw new Error('No payment_intent found in invoice');
    }

    return paymentIntentId;
  }

  
  async refundPayment(paymentIntentId: string, amount: number) {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
    });
  }

  constructWebhookEvent(body: Buffer, signature: string) {
    return this.stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  }
}
