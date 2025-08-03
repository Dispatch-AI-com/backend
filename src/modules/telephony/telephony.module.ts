import { Module } from '@nestjs/common';

import { CalllogModule } from '@/modules/calllog/calllog.module';
import { CompanyModule } from '@/modules/company/company.module';
import { ServiceModule } from '@/modules/service/service.module';
import { ServiceBookingModule } from '@/modules/service-booking/service-booking.module';
import { TranscriptModule } from '@/modules/transcript/transcript.module';
import { TranscriptChunkModule } from '@/modules/transcript-chunk/transcript-chunk.module';
import { UserModule } from '@/modules/user/user.module';

import { SessionHelper } from './helpers/session.helper';
import { SessionRepository } from './repositories/session.repository';
import { TelephonyController } from './telephony.controller';
import { TelephonyService } from './telephony.service';

@Module({
  imports: [
    CalllogModule,
    TranscriptModule,
    TranscriptChunkModule,
    UserModule,
    ServiceModule,
    ServiceBookingModule,
    CompanyModule,
  ],
  controllers: [TelephonyController],
  providers: [TelephonyService, SessionRepository, SessionHelper],
  exports: [TelephonyService],
})
export class TelephonyModule {}
