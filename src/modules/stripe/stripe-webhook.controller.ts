import {
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import Stripe from 'stripe';

import { SkipCSRF } from '@/common/decorators/skip-csrf.decorator';

import { SubscriptionService } from '../subscription/subscription.service';
import { StripeService } from './stripe.service';

@ApiTags('Stripe Webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @ApiOkResponse({ description: 'Stripe webhook received' })
  @Post('stripe')
  @SkipCSRF()
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(
        req.body as Buffer,
        signature,
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(
          '❌ Stripe signature verification failed:',
          err.message,
        );
        res.status(400).send(`Webhook Error: ${err.message}`);
      } else {
        this.logger.error(
          '❌ Stripe signature verification failed: unknown error',
        );
        res.status(400).send('Webhook Error');
      }
      return;
    }

    this.logger.log(`✅ Stripe Event Received: ${event.type}`);
    res.status(200).send('received');

    try {
      await this.processStripeEvent(event);
    } catch (err) {
      this.logger.error(`❌ Failed to process event: ${event.id}`, err);
    }
  }

  private async processStripeEvent(event: Stripe.Event): Promise<void> {
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

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(
    event: Stripe.Event,
  ): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = session.subscription as string;

    const subscription =
      await this.stripeService.retrieveSubscription(subscriptionId);

    const { userId, planId } = subscription.metadata;
    const stripeCustomerId = subscription.customer as string;

    const chargeId = await this.stripeService.retrievecharge(stripeCustomerId);
    if (typeof chargeId !== 'string') {
      this.logger.warn(`No charge found for customer: ${stripeCustomerId}`);
      return;
    }

    if (typeof userId !== 'string' || typeof planId !== 'string') {
      this.logger.error('Missing metadata: userId or planId');
      return;
    }

    try {
      await this.subscriptionService.activateSubscription(
        userId,
        planId,
        subscriptionId,
        stripeCustomerId,
        chargeId,
      );
      this.logger.log(
        `✅ Subscription ${subscriptionId} activated for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to activate subscription`, error);
    }
  }

  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const stripeSub = event.data.object as Stripe.Subscription;

    if (stripeSub.items.data.length !== 1) {
      this.logger.warn(
        `Unexpected multiple subscription items for ${stripeSub.id}`,
      );
      return;
    }

    const newPriceId = stripeSub.items.data[0].price.id;
    this.logger.log(
      `✅ newPriceId: ${newPriceId} for subscription ${stripeSub.id}`,
    );
    try {
      await this.subscriptionService.updatePlanByWebhook(
        stripeSub.id,
        newPriceId,
      );
      this.logger.log(`✅ Subscription ${stripeSub.id} plan updated`);
    } catch (err) {
      this.logger.error(
        `❌ Failed to update plan for subscription ${stripeSub.id}`,
        err,
      );
    }
  }

  private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;

    const subscriptionId = invoice.parent?.subscription_details
      ?.subscription as string;

    if (typeof subscriptionId !== 'string') {
      this.logger.error('No subscriptionId found in payment_failed webhook');
      return;
    }

    this.logger.warn(`❌ Payment failed for subscription: ${subscriptionId}`);

    try {
      // Check if subscription exists and get current status
      const subscription =
        await this.subscriptionService.findBySuscriptionId(subscriptionId);

      if (!subscription) {
        this.logger.warn(
          `[Webhook] ⚠️ Subscription ${subscriptionId} not found. Skipping payment failed handling.`,
        );
        return;
      }

      // Skip if subscription is already cancelled or pending cancellation
      if (
        subscription.status === 'cancelled' ||
        subscription.status === 'pending_cancellation'
      ) {
        this.logger.log(
          `⏭️ Subscription ${subscriptionId} is ${subscription.status}. Skipping payment failed handling.`,
        );
        return;
      }

      // Update subscription status to 'failed'
      await this.subscriptionService.updateStatusByWebhook(
        subscriptionId,
        'failed',
      );
      this.logger.log(
        `✅ Subscription ${subscriptionId} status updated to failed`,
      );

      // Suspend subscription by setting secondsLeft to 0
      await this.subscriptionService.suspendSubscription(subscriptionId);
      this.logger.log(
        `⏸️ Subscription ${subscriptionId} suspended (secondsLeft = 0)`,
      );
    } catch (err) {
      this.logger.error(
        `❌ Failed to process payment failed event for ${subscriptionId}`,
        err,
      );
    }
  }

  private async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.parent?.subscription_details
      ?.subscription as string;

    // Early validation - extract subscriptionId and validate
    if (!subscriptionId) {
      this.logger.error('No subscriptionId found in payment_succeeded webhook');
      return;
    }

    // Single database query to get subscription
    const subscription =
      await this.subscriptionService.findBySuscriptionId(subscriptionId);
    if (!subscription) {
      this.logger.warn(
        `[Webhook] ⚠️ Subscription ${subscriptionId} not found. Probably not created yet. Skipping.`,
      );
      return;
    }

    this.logger.log(`✅ Payment succeeded for subscription: ${subscriptionId}`);

    try {
      // Early return for cancelled subscriptions - no need to process further
      if (
        subscription.status === 'cancelled' ||
        subscription.status === 'pending_cancellation'
      ) {
        this.logger.log(
          `⏸️ Subscription ${subscriptionId} is ${subscription.status}, skipping payment processing`,
        );
        return;
      }

      // Update subscription status to active for non-cancelled subscriptions
      // But don't change pending_downgrade status - it should remain until cycle reset
      if (subscription.status !== 'pending_downgrade') {
        await this.subscriptionService.updateStatusByWebhook(
          subscriptionId,
          'active',
        );
        this.logger.log(
          `✅ Subscription ${subscriptionId} status updated to active`,
        );
      } else {
        this.logger.log(
          `⏸️ Subscription ${subscriptionId} is pending_downgrade, keeping status unchanged`,
        );
      }

      // Process recurring payment cycle reset
      await this.processRecurringPayment(subscriptionId, invoice);
    } catch (err) {
      this.logger.error(
        `❌ Failed to process payment succeeded for ${subscriptionId}`,
        err,
      );
    }
  }

  /**
   * Process recurring payment cycle reset
   * Extracted for better code organization and reusability
   */
  private async processRecurringPayment(
    subscriptionId: string,
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const billingReason = invoice.billing_reason;

    // Early return for non-recurring payments
    if (billingReason !== 'subscription_cycle') {
      this.logger.log(
        `🆕 First payment (${billingReason ?? 'unknown'}), skipping cycle reset`,
      );
      return;
    }

    // Extract period information from invoice lines
    const periodStart = invoice.lines.data[0]?.period?.start;
    const periodEnd = invoice.lines.data[0]?.period?.end;

    if (!periodStart || !periodEnd) {
      this.logger.error(
        `❌ Missing period information in invoice for ${subscriptionId}`,
      );
      return;
    }

    // This is a recurring payment - reset the subscription cycle using Stripe's period
    this.logger.log(
      `🔄 Recurring payment detected, resetting cycle for ${subscriptionId}`,
    );
    this.logger.log(
      `📅 Period: ${new Date(periodStart * 1000).toISOString()} - ${new Date(periodEnd * 1000).toISOString()}`,
    );

    await this.subscriptionService.resetSubscriptionCycleWithPeriod(
      subscriptionId,
      periodStart,
      periodEnd,
    );
  }

  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId = subscription.id;

    this.logger.log(`🗑️ Subscription deleted: ${subscriptionId}`);

    try {
      // Check if subscription exists in database
      const dbSubscription =
        await this.subscriptionService.findBySuscriptionId(subscriptionId);

      if (!dbSubscription) {
        this.logger.warn(
          `[Webhook] ⚠️ Subscription ${subscriptionId} not found in database. Skipping.`,
        );
        return;
      }

      // Update status to cancelled (from pending_cancellation or active)
      await this.subscriptionService.updateStatusByWebhook(
        subscriptionId,
        'cancelled',
      );

      // Set secondsLeft to 0 when subscription is cancelled
      await this.subscriptionService.suspendSubscription(subscriptionId);

      this.logger.log(
        `✅ Subscription ${subscriptionId} status updated to cancelled and suspended`,
      );
    } catch (err) {
      this.logger.error(
        `❌ Failed to process subscription deletion for ${subscriptionId}`,
        err,
      );
    }
  }
}
