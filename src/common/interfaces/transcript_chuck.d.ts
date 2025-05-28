import { Types } from 'mongoose';
import { SpeakerType } from '../constants/transcript_chunk.constant';

export interface ITranscriptChunk {
  transcriptId: Types.ObjectId;
  speakerType: SpeakerType;
  text: string;
  startAt: Date;
  endAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
