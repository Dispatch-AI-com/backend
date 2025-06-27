import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom, retry, timeout } from 'rxjs';

import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { winstonLogger } from '@/logger/winston.logger';
import {
  buildSayResponse,
  NextAction,
} from '@/modules/telephony/utils/twilio-response.util';

import { SessionRepository } from './repositories/session.repository';

const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://your-domain/api';
const AI_TIMEOUT_MS = 5_000;
const AI_RETRY = 2;

@Injectable()
export class TelephonyService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly http: HttpService,
  ) {}
  async handleVoice({ CallSid }: VoiceGatherBody): Promise<string> {
    let session = await this.sessions.load(CallSid);
    session ??= await this.sessions.create(CallSid);

    const { services, company } = session;
    const welcome =
      services.length && company.name
        ? `Welcome! We are ${company.name}. We provide ${services.map(s => s.name).join(', ')}. How can I help you today?`
        : 'Welcome! How can I help you today?';

    return this.speakAndLog(CallSid, welcome, NextAction.GATHER);
  }

  async handleGather({
    CallSid,
    SpeechResult = '',
  }: VoiceGatherBody): Promise<string> {
    const session = await this.sessions.load(CallSid);
    if (!session) {
      return buildSayResponse({
        text: 'System error.',
        next: NextAction.HANGUP,
        sid: CallSid,
        publicUrl: PUBLIC_URL,
      });
    }

    let reply = `Sorry, I didn't catch that.`;
    if (SpeechResult) {
      await this.sessions.appendHistory(CallSid, {
        speaker: 'customer',
        message: SpeechResult,
        startedAt: new Date().toISOString(),
      });
      try {
        const { data } = (await firstValueFrom(
          this.http
            .post<{ replyText: string }>('/ai/reply', {
              callSid: CallSid,
              message: SpeechResult,
            })
            .pipe(timeout(AI_TIMEOUT_MS), retry(AI_RETRY)),
        )) as { data: { replyText: string } };
        reply = data.replyText;
      } catch (err) {
        winstonLogger.error(`AI call failed: ${(err as Error).message}`);
        return this.speakAndLog(
          CallSid,
          'I am sorry, system error.',
          NextAction.HANGUP,
        );
      }
    }
    return this.speakAndLog(CallSid, reply, NextAction.GATHER);
  }
  async handleStatus({ CallSid, CallStatus }: VoiceStatusBody): Promise<void> {
    if (['completed', 'canceled'].includes(CallStatus)) {
      await this.sessions.delete(CallSid);
    }
    winstonLogger.log(`[STATUS] CallSid=${CallSid}, status=${CallStatus}`);
  }

  private async speakAndLog(
    callSid: string,
    text: string,
    next: NextAction,
  ): Promise<string> {
    await this.sessions.appendHistory(callSid, {
      speaker: 'AI',
      message: text,
      startedAt: new Date().toISOString(),
    });

    return buildSayResponse({
      text,
      next,
      sid: callSid,
      publicUrl: PUBLIC_URL,
    });
  }
}
