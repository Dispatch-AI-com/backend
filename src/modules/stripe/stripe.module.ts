import { forwardRef, Module } from '@nestjs/common';

import { SubscriptionModule } from '../subscription/subscription.module';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [forwardRef(() => SubscriptionModule)],
  controllers: [StripeWebhookController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
