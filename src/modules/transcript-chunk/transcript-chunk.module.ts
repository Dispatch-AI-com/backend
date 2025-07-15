import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TranscriptSchema } from '../transcript/schema/transcript.schema';
import { TranscriptChunkSchema } from './schema/transcript-chunk.schema';
import { TranscriptChunkController } from './transcript-chunk.controller';
import { TranscriptChunkService } from './transcript-chunk.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'TranscriptChunk', schema: TranscriptChunkSchema },
      { name: 'Transcript', schema: TranscriptSchema },
    ]),
  ],
  providers: [TranscriptChunkService],
  controllers: [TranscriptChunkController],
  exports: [TranscriptChunkService],
})
export class TranscriptChunkModule {}
