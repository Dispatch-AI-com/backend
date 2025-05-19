import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Transcript, TranscriptSchema } from './schema/transcript.schema';
import { TranscriptController } from './transcript.controller';
import { TranscriptService } from './transcript.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transcript.name, schema: TranscriptSchema },
    ]),
  ],
  controllers: [TranscriptController],
  providers: [TranscriptService],
})
export class TranscriptModule {}
