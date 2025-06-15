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
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ICallLogResponse {
  data: ICallLog[];
  pagination: ICallLogPagination;
}

export interface ICallLogMetrics {
  totalCalls: number;
  liveCalls: number;
}

export interface ICallLogSummary {
  totalCalls: number;
  completedCalls: number;
  missedCalls: number;
  followUpCalls: number;
  averageCallDuration: number;
}

export interface FindAllOptions {
  userId: string;
  status?: CallLogStatus;
  search?: string;
  startAtFrom?: string;
  startAtTo?: string;
  sort?: string;
  page?: number;
  limit?: number;
  fields?: Record<string, 1>;
}
