import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '@/modules/auth/auth.module';
import { DatabaseModule } from '@/modules/database/database.module';
import { HealthModule } from '@/modules/health/health.module';
import { PlanModule } from '@/modules/plan/plan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    PlanModule,
  ],
})
export class AppModule {}
