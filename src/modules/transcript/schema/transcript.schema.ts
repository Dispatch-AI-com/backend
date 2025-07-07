import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TranscriptDocument = Transcript & Document;

@Schema({ timestamps: true })
export class Transcript extends Document {
  @Prop({ type: String, required: true })
  callSid!: string;

  @Prop({ required: true })
  summary!: string;

  @Prop({ type: [String], default: [] })
  keyPoints?: string[];
}

export const TranscriptSchema = SchemaFactory.createForClass(Transcript);
