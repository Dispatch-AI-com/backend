import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Company,
  CompanySchema,
} from '@/modules/company/schema/company.schema';
import { User, userSchema } from '@/modules/user/schema/user.schema';

import { Setting, settingSchema } from './schema/setting.schema';
import { Verification, VerificationSchema } from './schema/verification.schema';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';
import { VerificationController } from './verification.controller';
import { AwsSesEmailVerificationService } from './aws-ses-email-verification.service.js';
import { AwsSnsSmsVerificationService } from './aws-sns-sms-verification.service.js';
import { VerificationService } from './verification.service';
import { IEmailVerificationService } from './interfaces/email-verification.interface.js';
import { ISmsVerificationService } from './interfaces/sms-verification.interface.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Setting.name, schema: settingSchema },
      { name: User.name, schema: userSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Verification.name, schema: VerificationSchema },
    ]),
  ],
  controllers: [SettingController, VerificationController],
  providers: [
    SettingService,
    VerificationService,
    {
      provide: 'IEmailVerificationService',
      useClass: AwsSesEmailVerificationService,
    },
    {
      provide: 'ISmsVerificationService',
      useClass: AwsSnsSmsVerificationService,
    },
    // Also provide concrete implementations for direct use if needed
    AwsSesEmailVerificationService,
    AwsSnsSmsVerificationService,
  ],
  exports: [
    SettingService,
    VerificationService,
    'IEmailVerificationService',
    'ISmsVerificationService',
    AwsSesEmailVerificationService,
    AwsSnsSmsVerificationService,
    MongooseModule,
  ],
})
export class SettingModule {}
