import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '@/modules/auth/auth.module';
import { DatabaseModule } from '@/modules/database/database.module';
import { HealthModule } from '@/modules/health/health.module';
import { PlanModule } from '@/modules/plan/plan.module';
import { SubscriptionModule } from '@/modules/subscription/subscription.module';
import { StripeModule } from '@/modules/stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    PlanModule,
    SubscriptionModule,
    StripeModule,
  ],
})
export class AppModule {}
