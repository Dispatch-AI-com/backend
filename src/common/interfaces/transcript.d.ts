import type { Types } from 'mongoose';

export interface ITranscript {
  _id: Types.ObjectId;
  calllogId: Types.ObjectId;
  summary: string;
  keyPoints?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
