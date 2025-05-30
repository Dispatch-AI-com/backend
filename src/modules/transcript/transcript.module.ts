import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TranscriptController } from './transcript.controller';
import { TranscriptService } from './transcript.service';
import { Transcript, TranscriptSchema } from './schema/transcript.schema';
import { TranscriptChunk, TranscriptChunkSchema } from '../transcript-chunk/schema/transcript-chunk.schema';
import { CallLog, CallLogSchema } from '../calllog/schema/calllog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transcript.name, schema: TranscriptSchema },
      { name: TranscriptChunk.name, schema: TranscriptChunkSchema },
      { name: CallLog.name, schema: CallLogSchema },
    ]),
  ],
  controllers: [TranscriptController],
  providers: [TranscriptService],
  exports: [TranscriptService],
})
export class TranscriptModule {}
