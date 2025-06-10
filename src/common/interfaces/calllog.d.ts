import type { CallLogStatus } from '../constants/calllog.constant';

export interface ICallLog {
  _id?: string;
  userId: string;
  serviceBookedId?: string;
  callerNumber: string;
  callerName?: string;
  status: CallLogStatus;
  startAt: Date;
  endAt?: Date;
  audioId?: string;
  transcriptId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  summary?: string;
}

export interface ICallLogPagination {
  page: number;
  limit: number;
  total: number;
}

export interface ICallLogResponse {
  data: ICallLog[];
  pagination: ICallLogPagination;
}

export interface ICallLogMetrics {
  totalCalls: number;
  liveCalls: number;
}
