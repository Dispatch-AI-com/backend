export interface TwilioVoiceWebhookBody {
  [key: string]: unknown;
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus: string;
  ApiVersion: string;
  Direction?: string;

  RecordingSid?: string;
  RecordingUrl?: string;
  RecordingDuration?: string;
  RecordingChannels?: string;
  RecordingSource?: string;
  RecordingStatus?: string;
  Digits?: string;
  CallerName?: string;
  ForwardedFrom?: string;
  Timestamp?: string;
}

export interface VoiceGatherBody {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: string;
  SpeechResult?: string;
  Confidence?: string;
  Digits?: string;
}

export interface VoiceRecordingBody {
  CallSid: string;
  RecordingSid: string;
  RecordingUrl: string;
  RecordingDuration: string;
  RecordingStatus: 'completed';
  Timestamp: string;
}

export interface VoiceStatusBody {
  CallSid: string;
  CallStatus:
    | 'queued'
    | 'ringing'
    | 'in-progress'
    | 'completed'
    | 'busy'
    | 'failed'
    | 'no-answer';
  Timestamp: string;
  CallDuration?: string;
}
