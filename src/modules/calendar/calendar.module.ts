import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [CalendarController],
})
export class CalendarModule {}