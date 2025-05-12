import type { CallLogStatus } from '../constants/calllog.constant';

export interface ICallLog {
  companyId: string;
  serviceBookedId: string;
  callerNumber: string;
  status: CallLogStatus;
  startAt: Date;
  endAt?: Date;
  recordingUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
