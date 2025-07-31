import type { Types } from 'mongoose';

import type { SpeakerType } from '../constants/transcript-chunk.constant';

export interface ITranscript {
  _id: string;
  callSid: string;
  summary: string;
  keyPoints?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITranscriptChunk {
  _id: string;
  transcriptId: string;
  speakerType: SpeakerType;
  text: string;
  startAt: number;
  endAt?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISanitizedUpdate {
  speakerType?: SpeakerType;
  text?: string;
  startAt?: number;
  endAt?: number;
  transcriptId?: Types.ObjectId;
}
