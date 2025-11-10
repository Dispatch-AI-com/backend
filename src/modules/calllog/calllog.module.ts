import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Transcript,
  TranscriptSchema,
} from '../transcript/schema/transcript.schema';
import { TranscriptModule } from '../transcript/transcript.module';
import { TranscriptChunkModule } from '../transcript-chunk/transcript-chunk.module';
import { CalllogController } from './calllog.controller';
import { CalllogService } from './calllog.service';
import { InternalCalllogController } from './internal-calllog.controller';
import { CallLog, CallLogSchema } from './schema/calllog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallLog.name, schema: CallLogSchema },
      { name: Transcript.name, schema: TranscriptSchema },
    ]),
    TranscriptModule,
    TranscriptChunkModule,
  ],
  controllers: [CalllogController, InternalCalllogController],
  providers: [CalllogService],
  exports: [CalllogService],
})
export class CalllogModule {}
