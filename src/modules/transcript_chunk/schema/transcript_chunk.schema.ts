import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TranscriptChunkDocument = TranscriptChunk & Document;

@Schema({ timestamps: true })
export class TranscriptChunk {
  @Prop({
    type: Types.ObjectId,
    ref: 'Transcript',
    required: true,
    index: true,
  })
  transcriptId!: Types.ObjectId;

  @Prop({ enum: ['AI', 'User'], required: true })
  speakerType!: 'AI' | 'User';

  @Prop({ required: true })
  text!: string;

  @Prop({ type: Date, required: true })
  startAt!: Date;
}

export const TranscriptChunkSchema =
  SchemaFactory.createForClass(TranscriptChunk);

TranscriptChunkSchema.index({ transcriptId: 1, startAt: 1 });
