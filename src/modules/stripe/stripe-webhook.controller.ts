import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(req.body, signature);
    } catch (err: any) {
      this.logger.error('❌ Stripe signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`✅ Stripe Event Received: ${event.type}`);

    res.status(200).send('received');

    try {
      await this.processStripeEvent(event);
    } catch (err) {
      this.logger.error(`❌ Failed to process event: ${event.id}`, err);
    }
  }

  private async processStripeEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = session.subscription as string;

    const subscription = await this.stripeService.retrieveSubscription(subscriptionId);
    if (!subscription) {
      this.logger.warn(`Subscription not found for ID: ${subscriptionId}`);
      return;
    }

    const companyId = subscription.metadata?.companyId as string;
    const planId = subscription.metadata?.planId as string;

    if (!companyId || !planId) {
      this.logger.error('Missing metadata: companyId or planId');
      return;
    }

    try {
      await this.subscriptionService.activateSubscription(companyId, planId, subscriptionId);
      this.logger.log(`✅ Subscription ${subscriptionId} activated for company ${companyId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to activate subscription`, error);
    }
  }

  private async handleSubscriptionUpdated(event: Stripe.Event) {
    const stripeSub = event.data.object as Stripe.Subscription;

    if (stripeSub.items.data.length !== 1) {
      this.logger.warn(`Unexpected multiple subscription items for ${stripeSub.id}`);
      return;
    }

    const newPriceId = stripeSub.items.data[0].price.id;
    this.logger.log(`✅ newPriceId: ${newPriceId} for subscription ${stripeSub.id}`);
    try {
      await this.subscriptionService.updatePlanByWebhook(stripeSub.id, newPriceId);
      this.logger.log(`✅ Subscription ${stripeSub.id} plan updated`);
    } catch (err) {
      this.logger.error(`❌ Failed to update plan for subscription ${stripeSub.id}`, err);
    }
  }

  async handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  const subscriptionId = invoice?.parent?.subscription_details?.subscription as string;

  if (!subscriptionId) {
    this.logger.error('No subscriptionId found in payment_failed webhook');
    return;
  }

  this.logger.warn(`❌ Payment failed for subscription: ${subscriptionId}`);

  try {
    await this.subscriptionService.updateStatusByWebhook(subscriptionId, 'failed');
    this.logger.log(`✅ Subscription ${subscriptionId} status updated to failed`);
  } catch (err) {
    this.logger.error(`❌ Failed to update subscription status for ${subscriptionId}`, err);
  }
}



}
