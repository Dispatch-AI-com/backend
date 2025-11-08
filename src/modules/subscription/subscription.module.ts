import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Plan, planSchema } from '../plan/schema/plan.schema';
import { StripeModule } from '../stripe/stripe.module';
import { TwilioPhoneNumberAssignmentModule } from '../twilio-phone-number-assignment/twilio-phone-number-assignment.module';
import { User, userSchema } from '../user/schema/user.schema';
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
    forwardRef(() => TwilioPhoneNumberAssignmentModule),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
