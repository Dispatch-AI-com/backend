import { Injectable } from '@nestjs/common';

import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';

import { CallProcessorService } from './services/call-processor.service';

@Injectable()
export class TelephonyService {
  constructor(private readonly callProcessor: CallProcessorService) {}
  async handleVoice(voiceData: VoiceGatherBody): Promise<string> {
    return this.callProcessor.handleVoice(voiceData);
  }

  async handleGather(gatherData: VoiceGatherBody): Promise<string> {
    return this.callProcessor.handleGather(gatherData);
  }
  async handleStatus(statusData: VoiceStatusBody): Promise<void> {
    return this.callProcessor.handleStatus(statusData);
  }
}
