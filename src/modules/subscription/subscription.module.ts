import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { Subscription, SubscriptionSchema } from './schema/subscription.schema';
import { Plan, planSchema } from '../plan/schema/plan.schema';
import { Company, CompanySchema } from '../company/schema/company.schema';
import { StripeModule } from '../stripe/stripe.module'; 

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: planSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    StripeModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
