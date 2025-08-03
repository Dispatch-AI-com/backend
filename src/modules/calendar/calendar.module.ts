import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [UserModule],
  controllers: [CalendarController],
})
export class CalendarModule {}
