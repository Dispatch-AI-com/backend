import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from '../user/user.module';
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
    UserModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
