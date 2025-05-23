import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CalllogModule } from '../calllog/calllog.module';
import { CallLog, CallLogSchema } from '../calllog/schema/calllog.schema';
import {
  TranscriptChunk,
  TranscriptChunkSchema,
} from '../transcript_chunk/schema/transcript_chunk.schema';
import { Transcript, TranscriptSchema } from './schema/transcript.schema';
import { TranscriptController } from './transcript.controller';
import { TranscriptService } from './transcript.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transcript.name, schema: TranscriptSchema },
      { name: TranscriptChunk.name, schema: TranscriptChunkSchema },
      { name: CallLog.name, schema: CallLogSchema },
    ]),
    forwardRef(() => CalllogModule),
  ],
  controllers: [TranscriptController],
  providers: [TranscriptService],
})
export class TranscriptModule {}
