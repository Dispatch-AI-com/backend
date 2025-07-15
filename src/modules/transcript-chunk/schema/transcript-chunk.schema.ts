import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { SpeakerType } from '../../../common/constants/transcript-chunk.constant';

export type TranscriptChunkDocument = TranscriptChunk & Document;

@Schema({ timestamps: true })
export class TranscriptChunk extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  transcriptId!: Types.ObjectId;

  @Prop({ type: String, enum: ['AI', 'User'], required: true })
  speakerType!: SpeakerType;

  @Prop({ type: String, required: true })
  text!: string;

<<<<<<< HEAD:src/modules/transcript-chunk/schema/transcript-chunk.schema.ts
  @Prop({ type: Number, required: true })
  startAt!: number;
=======
  @Prop({ type: Date, required: true })
  startAt!: Date;
>>>>>>> origin/twilio-ai-v4:src/modules/transcript_chunk/schema/transcript_chunk.schema.ts
}

export const TranscriptChunkSchema =
  SchemaFactory.createForClass(TranscriptChunk);

TranscriptChunkSchema.index({ transcriptId: 1, startAt: 1 });
