import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import {
  CallLogStatus,
  DEFAULT_CALLLOG_STATUS,
} from '@/common/constants/calllog.constant';

export type CallLogDocument = HydratedDocument<CallLog>;

@Schema({ timestamps: true })
export class CallLog {
  @Prop({ required: true, unique: true })
  callSid!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop()
  serviceBookedId?: string;

  @Prop({ required: true })
  callerNumber!: string;

  @Prop()
  callerName?: string;

  @Prop({
    required: true,
    type: String,
    enum: CallLogStatus,
    default: DEFAULT_CALLLOG_STATUS,
  })
  status!: CallLogStatus;

  @Prop({ required: true, type: Date })
  startAt!: Date;
}

export const CallLogSchema = SchemaFactory.createForClass(CallLog);

CallLogSchema.index({ userId: 1, startAt: -1 });
CallLogSchema.index({ callSid: 1 });
