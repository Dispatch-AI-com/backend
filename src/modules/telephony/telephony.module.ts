import { Module } from '@nestjs/common';

import { SessionRepository } from './repositories/session.repository';
import { TelephonyController } from './telephony.controller';
import { TelephonyService } from './telephony.service';

@Module({
  controllers: [TelephonyController],
  providers: [TelephonyService, SessionRepository],
  exports: [TelephonyService],
})
export class TelephonyModule {}
