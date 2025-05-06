import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CalllogController } from './calllog.controller';
import { CalllogService } from './calllog.service';
import { CallLog, CallLogSchema } from './schema/calllog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CallLog.name, schema: CallLogSchema }])
  ],
  controllers: [CalllogController],
  providers: [CalllogService],
  exports: [CalllogService],
})
export class CalllogModule {}
