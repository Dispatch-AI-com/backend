import type { Types } from 'mongoose';

import type { SpeakerType } from '../constants/transcript-chunk.constant';

export interface ITranscriptChunk {
  _id: Types.ObjectId;
  transcriptId: Types.ObjectId;
  speakerType: SpeakerType;
  text: string;
  startAt: number;
  endAt: number;
  createdAt?: Date;
  updatedAt?: Date;
}
