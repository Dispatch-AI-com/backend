import type { CallLogStatus } from '@/common/constants/calllog.constant';

export interface TranscriptChunk {
  transcriptId: string;
  speakerType: 'AI' | 'User';
  text: string;
  recordingUrl: string;
  startAt: Date;
}

export interface CallLog {
  companyId: string;
  transcriptChunks: TranscriptChunk[];
  serviceBookedId: string;
  callerNumber: string;
  status: CallLogStatus;
  startAt: Date;
  endAt: Date;
}
