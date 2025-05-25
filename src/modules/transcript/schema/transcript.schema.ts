import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Transcript extends Document {
  @Prop({ type: Types.ObjectId, ref: 'CallLog', required: true })
  calllogid!: Types.ObjectId;

  @Prop({ type: String, required: true })
  summary!: string;
}

export const TranscriptSchema = SchemaFactory.createForClass(Transcript);
