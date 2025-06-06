import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '@/modules/auth/auth.module';
import { AvailabilityModule } from '@/modules/availability/availability.module';
import { CalllogModule } from '@/modules/calllog/calllog.module';
import { DatabaseModule } from '@/modules/database/database.module';
import { HealthModule } from '@/modules/health/health.module';
import { LocationModule } from '@/modules/location/location.module';
import { PlanModule } from '@/modules/plan/plan.module';

import { ServiceModule } from '@/modules/service/service.module';
import { ServiceBookingModule } from '@/modules/service-booking/service-booking.module';
import { ServiceFormFieldModule } from '@/modules/service-form-field/service-form-field.module';
import { ServiceLocationMappingModule } from '@/modules/service-location-mapping/service-location-mapping.module';

import { TranscriptModule } from '@/modules/transcript/transcript.module';
import { TranscriptChunkModule } from '@/modules/transcript_chunk/transcript_chunk.module';
import { WhisperModule } from '@/modules/whisper/whisper.module';

import { SubscriptionModule } from '@/modules/subscription/subscription.module';
import { StripeModule } from '@/modules/stripe/stripe.module';
import { CompanyModule } from './company/company.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    PlanModule,
    LocationModule,
    WhisperModule,
    CalllogModule,
    TranscriptModule,
    TranscriptChunkModule,
    AvailabilityModule,
    ServiceBookingModule,
    ServiceFormFieldModule,
    ServiceModule,
    ServiceLocationMappingModule,
    SubscriptionModule,
    StripeModule,
    CompanyModule
  ],
})
export class AppModule {}
