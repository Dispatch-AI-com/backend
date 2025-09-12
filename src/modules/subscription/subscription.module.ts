import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { VerificationGuard } from '@/common/guards/verification.guard';

import { Plan, planSchema } from '../plan/schema/plan.schema';
import { StripeModule } from '../stripe/stripe.module';
import { User, userSchema } from '../user/schema/user.schema';
import { UserModule } from '../user/user.module';
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
    UserModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, VerificationGuard],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
