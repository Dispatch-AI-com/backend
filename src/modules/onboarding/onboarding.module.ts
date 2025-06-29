import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

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
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
