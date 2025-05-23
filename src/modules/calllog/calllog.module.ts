import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Transcript,
  TranscriptSchema,
} from '../transcript/schema/transcript.schema';
import { CalllogController } from './calllog.controller';
import { CalllogService } from './calllog.service';
import { CallLog, CallLogSchema } from './schema/calllog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallLog.name, schema: CallLogSchema },
      { name: Transcript.name, schema: TranscriptSchema },
    ]),
  ],
  controllers: [CalllogController],
  providers: [CalllogService],
  exports: [CalllogService],
})
export class CalllogModule {}
