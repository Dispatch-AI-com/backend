import { Module } from '@nestjs/common';

import { TelephonyController } from './telephony.controller';
import { TelephonyService } from './telephony.service';

@Module({
  controllers: [TelephonyController],
  providers: [TelephonyService],
  exports: [TelephonyService],
})
export class TelephonyModule {}
