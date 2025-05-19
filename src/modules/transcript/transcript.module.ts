import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transcript, TranscriptSchema } from './schema/transcript.schema';
import { TranscriptService } from './transcript.service';
import { TranscriptController } from './transcript.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transcript.name, schema: TranscriptSchema }]),
  ],
  controllers: [TranscriptController],
  providers: [TranscriptService],
})
export class TranscriptModule {}
