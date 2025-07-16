import { Module } from '@nestjs/common';

import { CalllogModule } from '@/modules/calllog/calllog.module';
import { ServiceModule } from '@/modules/service/service.module';
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
  ],
  controllers: [TelephonyController],
  providers: [TelephonyService, SessionRepository, SessionHelper],
  exports: [TelephonyService],
})
export class TelephonyModule {}
