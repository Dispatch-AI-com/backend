import type { Types } from 'mongoose';

import type { SpeakerType } from '../constants/transcript-chunk.constant';

export interface ITranscriptChunk {
  _id: string;
  transcriptId: string;
  speakerType: SpeakerType;
  text: string;
  startAt: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISanitizedUpdate {
  speakerType?: SpeakerType;
  text?: string;
  startAt?: number;
  transcriptId?: Types.ObjectId;
}
