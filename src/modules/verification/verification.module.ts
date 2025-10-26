import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, userSchema } from '@/modules/user/schema/user.schema';

import { VerificationController } from './controllers/verification.controller';
import {
  Verification,
  VerificationSchema,
} from './schemas/verification.schema';
import {
  VerificationCode,
  VerificationCodeSchema,
} from './schemas/verification-code.schema';
import { AwsSesEmailVerificationService } from './services/aws-ses-email-verification.service';
import { AwsSnsSmsVerificationService } from './services/aws-sns-sms-verification.service';
import { VerificationService } from './services/verification.service';
import { VerificationCodeService } from './services/verification-code.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Verification.name, schema: VerificationSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
      { name: User.name, schema: userSchema },
    ]),
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    VerificationCodeService,
    AwsSesEmailVerificationService,
    AwsSnsSmsVerificationService,
  ],
  exports: [
    VerificationService,
    VerificationCodeService,
    AwsSesEmailVerificationService,
    AwsSnsSmsVerificationService,
    MongooseModule,
  ],
})
export class VerificationModule {}
