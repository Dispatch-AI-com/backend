import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Company,
  CompanySchema,
} from '@/modules/company/schema/company.schema';
import { User, userSchema } from '@/modules/user/schema/user.schema';

import { Setting, settingSchema } from './schema/setting.schema';
import { Verification, VerificationSchema } from './schema/verification.schema';
import { VerificationCode, VerificationCodeSchema } from './schema/verification-code.schema';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { AwsSesEmailVerificationService } from './services/aws-ses-email-verification.service';
import { VerificationCodeService } from './services/verification-code.service';
import { AwsSnsSmsVerificationService } from './services/aws-sns-sms-verification.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Setting.name, schema: settingSchema },
      { name: User.name, schema: userSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Verification.name, schema: VerificationSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
    ]),
  ],
  controllers: [SettingController, VerificationController],
  providers: [SettingService, VerificationService, AwsSesEmailVerificationService, VerificationCodeService, AwsSnsSmsVerificationService],
  exports: [SettingService, VerificationService, MongooseModule],
})
export class SettingModule {}
