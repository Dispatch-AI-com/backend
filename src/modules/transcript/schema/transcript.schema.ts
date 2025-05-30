import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Transcript extends Document {
  @Prop({ type: Types.ObjectId, ref: 'CallLog', required: true })
  calllogId!: Types.ObjectId;

  @Prop({ required: true })
  summary!: string;
}

export const TranscriptSchema = SchemaFactory.createForClass(Transcript);
