import { Module } from '@nestjs/common';

import { CalllogModule } from '@/modules/calllog/calllog.module';
import { TranscriptModule } from '@/modules/transcript/transcript.module';
import { TranscriptChunkModule } from '@/modules/transcript-chunk/transcript-chunk.module';
import { CompanyModule } from '@/modules/company/company.module';
import { ServiceModule } from '@/modules/service/service.module';

import { SessionHelper } from './helpers/session.helper';
import { SessionRepository } from './repositories/session.repository';
import { TelephonyController } from './telephony.controller';
import { TelephonyService } from './telephony.service';

@Module({
  imports: [CalllogModule, TranscriptModule, TranscriptChunkModule, CompanyModule, ServiceModule],
  controllers: [TelephonyController],
  providers: [TelephonyService, SessionRepository, SessionHelper],
  exports: [TelephonyService],
})
export class TelephonyModule {}
