import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CalllogController } from './calllog.controller';
import { CalllogService } from './calllog.service';
import { CallLog, CallLogSchema } from './schema/calllog.schema';
import { TranscriptModule } from '../transcript/transcript.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CallLog.name, schema: CallLogSchema }]),
    forwardRef(() => TranscriptModule),
  ],
  controllers: [CalllogController],
  providers: [CalllogService],
  exports: [CalllogService],
})
export class CalllogModule {}
