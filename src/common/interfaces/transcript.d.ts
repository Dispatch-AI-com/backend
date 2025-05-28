import type { Types } from 'mongoose';

export interface ITranscript {
  calllogid: Types.ObjectId;
  summary: string;
  createdAt?: Date;
  updatedAt?: Date;
}
