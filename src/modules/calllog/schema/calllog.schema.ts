import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CallLogDocument = HydratedDocument<CallLog>;

@Schema({ timestamps: true })
export class CallLog {
  @Prop({ required: true })
  companyId!: string;

  @Prop({ required: true })
  serviceBookedId!: string;

  @Prop({ required: true })
  callerNumber!: string;

  @Prop({ required: true })
  status!: string;

  @Prop({ required: true, type: Date })
  startAt!: Date;

  @Prop({ type: Date })
  endAt?: Date;

  @Prop()
  recordingUrl?: string;
}

export const CallLogSchema = SchemaFactory.createForClass(CallLog);

CallLogSchema.index({ companyId: 1, startAt: -1 });
