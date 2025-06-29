import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TranscriptDocument = Transcript & Document;

@Schema({ timestamps: true })
export class Transcript extends Document {
  @Prop({ type: Types.ObjectId, ref: 'CallLog', required: true })
  calllogId!: Types.ObjectId;

  @Prop({ required: true })
  summary!: string;

  @Prop({ type: [String], default: [] })
  keyPoints?: string[];
}

export const TranscriptSchema = SchemaFactory.createForClass(Transcript);
