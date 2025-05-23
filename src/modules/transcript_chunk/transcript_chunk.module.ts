import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  TranscriptChunk,
  TranscriptChunkSchema,
} from './schema/transcript_chunk.schema';
import { TranscriptChunkController } from './transcript_chunk.controller';
import { TranscriptChunkService } from './transcript_chunk.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TranscriptChunk.name, schema: TranscriptChunkSchema },
    ]),
  ],
  providers: [TranscriptChunkService],
  controllers: [TranscriptChunkController],
  exports: [TranscriptChunkService],
})
export class TranscriptChunkModule {}
