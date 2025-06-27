import { Module } from '@nestjs/common';

import { SessionHelper } from './helpers/session.helper';
import { SessionRepository } from './repositories/session.repository';
import { TelephonyController } from './telephony.controller';
import { TelephonyService } from './telephony.service';

@Module({
  controllers: [TelephonyController],
  providers: [TelephonyService, SessionRepository, SessionHelper],
  exports: [TelephonyService],
})
export class TelephonyModule {}
