import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '@/modules/auth/auth.module';
import { AvailabilityModule } from '@/modules/availability/availability.module';
import { CalllogModule } from '@/modules/calllog/calllog.module';
import { DatabaseModule } from '@/modules/database/database.module';
import { HealthModule } from '@/modules/health/health.module';
import { LocationModule } from '@/modules/location/location.module';
import { PlanModule } from '@/modules/plan/plan.module';
import { ServiceBookingModule } from '@/modules/service-booking/service-booking.module';
import { ServiceFormFieldModule } from '@/modules/service-form-field/service-form-field.module';
import { TranscriptModule } from '@/modules/transcript/transcript.module';
import { TranscriptChunkModule } from '@/modules/transcript_chunk/transcript_chunk.module';
import { WhisperModule } from '@/modules/whisper/whisper.module';

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
  ],
})
export class AppModule {}
