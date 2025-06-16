import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Transcript,
  TranscriptSchema,
} from '../transcript/schema/transcript.schema';
import {
  TranscriptChunk,
  TranscriptChunkSchema,
} from './schema/transcript-chunk.schema';
import { TranscriptChunkController } from './transcript-chunk.controller';
import { TranscriptChunkService } from './transcript-chunk.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TranscriptChunk.name, schema: TranscriptChunkSchema },
      { name: Transcript.name, schema: TranscriptSchema },
    ]),
  ],
  providers: [TranscriptChunkService],
  controllers: [TranscriptChunkController],
  exports: [TranscriptChunkService],
})
export class TranscriptChunkModule {}
