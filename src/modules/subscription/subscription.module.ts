import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, userSchema } from '../user/schema/user.schema';
import { Plan, planSchema } from '../plan/schema/plan.schema';
import { StripeModule } from '../stripe/stripe.module';
import { Subscription, SubscriptionSchema } from './schema/subscription.schema';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: planSchema },
      { name: User.name, schema: userSchema },
    ]),
    forwardRef(() => StripeModule),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
