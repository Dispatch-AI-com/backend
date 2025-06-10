import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import {
  CallLogStatus,
  DEFAULT_CALLLOG_STATUS,
} from '@/common/constants/calllog.constant';

export type CallLogDocument = HydratedDocument<CallLog>;

@Schema({ timestamps: true })
export class CallLog {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  serviceBookedId!: string;

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

  @Prop({ type: Date })
  endAt?: Date;

  @Prop()
  audioId?: string;

  @Prop()
  summary?: string;
}

export const CallLogSchema = SchemaFactory.createForClass(CallLog);

CallLogSchema.index({ userId: 1, startAt: -1 });
