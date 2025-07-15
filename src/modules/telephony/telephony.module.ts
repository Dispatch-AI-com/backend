import { Module } from '@nestjs/common';

<<<<<<< HEAD
import { CalllogModule } from '@/modules/calllog/calllog.module';
import { TranscriptModule } from '@/modules/transcript/transcript.module';
import { TranscriptChunkModule } from '@/modules/transcript-chunk/transcript-chunk.module';

=======
>>>>>>> origin/twilio-ai-v4
import { SessionHelper } from './helpers/session.helper';
import { SessionRepository } from './repositories/session.repository';
import { TelephonyController } from './telephony.controller';
import { TelephonyService } from './telephony.service';

@Module({
<<<<<<< HEAD
  imports: [CalllogModule, TranscriptModule, TranscriptChunkModule],
=======
>>>>>>> origin/twilio-ai-v4
  controllers: [TelephonyController],
  providers: [TelephonyService, SessionRepository, SessionHelper],
  exports: [TelephonyService],
})
export class TelephonyModule {}
