import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CompanyModule } from '../company/company.module';
import { SettingModule } from '../setting/setting.module';
import { UserModule } from '../user/user.module';
import { VerificationModule } from '../verification/verification.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import {
  OnboardingSession,
  OnboardingSessionSchema,
} from './schema/onboarding-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OnboardingSession.name, schema: OnboardingSessionSchema },
    ]),
    CompanyModule,
    UserModule,
    SettingModule,
    VerificationModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
