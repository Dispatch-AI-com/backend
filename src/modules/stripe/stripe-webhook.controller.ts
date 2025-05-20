import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Controller('webhooks')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('stripe')
  @HttpCode(200) 
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(req.body, signature);
    } catch (err: any) {
      console.error('❌ Stripe signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('✅ Stripe Event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { companyId, planId } = session.metadata || {};

      if (companyId && planId) {
        await this.subscriptionService.activateSubscription(companyId, planId);
      } else {
        console.warn('⚠️ Webhook session.metadata need companyId or planId');
      }
    }

    return res.send('ok');
  }
}
