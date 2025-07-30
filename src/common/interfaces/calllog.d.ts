export interface ICallLog {
  _id?: string;
  userId: string;
  serviceBookedId?: string;
  callerNumber: string;
  callerName?: string;
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
}

export interface ICallLogSummary {
  totalCalls: number;
  averageCallDuration: number;
}

export interface FindAllOptions {
  userId: string;
  search?: string;
  startAtFrom?: string;
  startAtTo?: string;
  sort?: string;
  page?: number;
  limit?: number;
  fields?: Record<string, 1>;
}
