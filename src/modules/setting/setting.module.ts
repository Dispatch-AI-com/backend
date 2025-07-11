import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Setting, settingSchema } from './schema/setting.schema';
import { UserSetting, userSettingSchema } from './schema/user-setting.schema';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Setting.name, schema: settingSchema },
      { name: UserSetting.name, schema: userSettingSchema },
    ]),
  ],
  controllers: [SettingController],
  providers: [SettingService],
  exports: [SettingService, MongooseModule],
})
export class SettingModule {}
