import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Twilio } from 'twilio';
import { twiml } from 'twilio';

import {
  VoiceGatherBody,
  VoiceRecordingBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { TWILIO_CLIENT } from '@/lib/twilio/twilio.module';

const PUBLIC_URL =
  process.env.PUBLIC_URL != null && process.env.PUBLIC_URL !== ''
    ? process.env.PUBLIC_URL
    : 'http://paco.dispatchai.click/api';
const BOT_TO = 'client:bot123';

@Injectable()
export class TelephonyService {
  constructor(@Inject(TWILIO_CLIENT) private readonly client: Twilio) {}

  handleVoiceWebhook(body: VoiceGatherBody): string {
    const { CallSid } = body;
    const vr = new twiml.VoiceResponse();

    vr.say('您好，欢迎使用 Dispatch AI，请稍等，系统正在为您接入服务。');
    vr.redirect(
      `${PUBLIC_URL}/telephony/enter-conference?CallSid=${CallSid}&To=${body.To}`,
    );
    return vr.toString() as string;
  }

  handleRecording(body: VoiceRecordingBody): void {
    console.log(`[RECORDING CALLBACK] CallSid=${body.CallSid}`);
    console.log(`🎧 Recording URL: ${body.RecordingUrl}.mp3`);
  }

  async handleCallStatus(body: VoiceStatusBody): Promise<void> {
    console.log(`[STATUS] CallSid=${body.CallSid}, status=${body.CallStatus}`);
  }

  handleEnterConference(callSid: string, to: string): string {
    if (!callSid || !to) {
      throw new BadRequestException('CallSid and To are required');
    }

    const vr = new twiml.VoiceResponse();
    vr.dial({
      record: 'record-from-ringing',
      recordingStatusCallback: `${PUBLIC_URL}/telephony/recording`,
      recordingStatusCallbackMethod: 'POST',
      recordingStatusCallbackEvent: ['completed'],
    }).conference(
      {
        startConferenceOnEnter: true,
        endConferenceOnExit: true,
      },
      callSid,
    );
    void this.client
      .conferences(callSid)
      .participants.create({
        from: to,
        to: BOT_TO,
        earlyMedia: true,
        endConferenceOnExit: true,
      })
      .then(() => {
        console.log(`🤖 Bot joined conference ${callSid}`);
      })
      .catch((err: unknown) => {
        console.error(`❌ Bot failed to join conference ${callSid}`, err);
      });

    return vr.toString() as string;
  }
}
