import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Company,
  CompanySchema,
} from '@/modules/company/schema/company.schema';
import { User, userSchema } from '@/modules/user/schema/user.schema';

import { VerificationModule } from '../verification/verification.module';
import { Setting, settingSchema } from './schema/setting.schema';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Setting.name, schema: settingSchema },
      { name: User.name, schema: userSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    VerificationModule,
  ],
  controllers: [SettingController],
  providers: [SettingService],
  exports: [SettingService, MongooseModule],
})
export class SettingModule {}
