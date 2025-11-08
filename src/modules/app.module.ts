import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { CSRFGuard } from '@/common/guards/csrf.guard';
import { AiHttpModule } from '@/lib/ai/ai-http.module';
import { RedisModule } from '@/lib/redis/redis.module';
import { TwilioModule } from '@/lib/twilio/twilio.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AvailabilityModule } from '@/modules/availability/availability.module';
import { BlogModule } from '@/modules/blog/blog.module';
import { CalllogModule } from '@/modules/calllog/calllog.module';
import { CompanyModule } from '@/modules/company/company.module';
import { DatabaseModule } from '@/modules/database/database.module';
import { CalendarModule } from '@/modules/google-calendar/calendar.module';
import { GooglePlacesModule } from '@/modules/google-places/google-places.module';
import { HealthModule } from '@/modules/health/health.module';
import { LocationModule } from '@/modules/location/location.module';
import { PlanModule } from '@/modules/plan/plan.module';
import { ServiceModule } from '@/modules/service/service.module';
import { ServiceBookingModule } from '@/modules/service-booking/service-booking.module';
import { ServiceFormFieldModule } from '@/modules/service-form-field/service-form-field.module';
import { ServiceLocationMappingModule } from '@/modules/service-location-mapping/service-location-mapping.module';
import { SettingModule } from '@/modules/setting/setting.module';
import { StripeModule } from '@/modules/stripe/stripe.module';
import { SubscriptionModule } from '@/modules/subscription/subscription.module';
import { TelephonyModule } from '@/modules/telephony/telephony.module';
import { TranscriptModule } from '@/modules/transcript/transcript.module';
import { TranscriptChunkModule } from '@/modules/transcript-chunk/transcript-chunk.module';
import { TwilioPhoneNumberModule } from '@/modules/twilio-phone-number/twilio-phone-number.module';
import { TwilioPhoneNumberAssignmentModule } from '@/modules/twilio-phone-number-assignment/twilio-phone-number-assignment.module';
import { UserModule } from '@/modules/user/user.module';

import { OnboardingModule } from './onboarding/onboarding.module';

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
    CalllogModule,
    CalendarModule,
    GooglePlacesModule,
    BlogModule,
    CompanyModule,
    TranscriptModule,
    TranscriptChunkModule,
    AvailabilityModule,
    ServiceBookingModule,
    ServiceFormFieldModule,
    ServiceModule,
    ServiceLocationMappingModule,
    TelephonyModule,
    TwilioModule,
    TwilioPhoneNumberModule,
    TwilioPhoneNumberAssignmentModule,
    RedisModule,
    AiHttpModule,
    SubscriptionModule,
    StripeModule,
    UserModule,
    OnboardingModule,
    SettingModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CSRFGuard,
    },
  ],
})
export class AppModule {}
