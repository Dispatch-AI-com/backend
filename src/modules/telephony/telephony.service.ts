import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { firstValueFrom, retry, timeout } from 'rxjs';
import { twiml } from 'twilio';

import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { REDIS_CLIENT } from '@/lib/redis/redis.module';
import { winstonLogger } from '@/logger/winston.logger';

import { CallSkeleton } from './types/redis-session';

const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://your-domain/api';
const SESSION_TTL = 60 * 30;

@Injectable()
export class TelephonyService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly http: HttpService,
  ) {}
  async handleVoice({ CallSid }: VoiceGatherBody): Promise<string> {
    const key = `call:${CallSid}`;
    if ((await this.redis.exists(key)) === 0) {
      //todo: 查询公司和服务，放到这个service和company的session里面
      const skeleton: CallSkeleton = {
        callSid: CallSid,
        services: [],
        company: { id: '', name: '' },
        user: {
          service: undefined,
          serviceBookedTime: undefined,
          userInfo: {},
        },
        history: [],
        confirmBooking: false,
        confirmEmailSent: false,
        createdAt: new Date().toISOString(),
      };
      await this.redis.set(key, JSON.stringify(skeleton), 'EX', SESSION_TTL);
    }

    let session: CallSkeleton;
    const raw = await this.redis.get(key);
    if (raw === null || raw === '') {
      winstonLogger.error(`[REDIS] key ${key} not found`);
      return this.buildSayAndGather(CallSid, 'System error.');
    }

    try {
      session = JSON.parse(raw as string) as CallSkeleton;
    } catch (err) {
      winstonLogger.error(
        `[PARSE] ${err instanceof Error ? err.message : String(err)}`,
      );
      return this.buildSayAndGather(CallSid, 'System error.');
    }

    const { services, company } = session;
    const welcome =
      services.length && company.name
        ? `Welcome! We are ${company.name}. We provide ${services.map(s => s.name).join(', ')}. How can I help you today?`
        : 'Welcome! How can I help you today?';

    return this.buildSayAndGather(CallSid, welcome);
  }

  async handleGather({
    CallSid,
    SpeechResult = '',
  }: VoiceGatherBody): Promise<string> {
    let reply = `Sorry, I didn't catch that.`;

    if (SpeechResult) {
      try {
        const { data } = (await firstValueFrom(
          this.http
            .post<{ replyText: string }>('/reply', {
              callSid: CallSid,
              message: SpeechResult,
            })
            .pipe(timeout(5_000), retry(2)),
        )) as { data: { replyText: string } };
        reply = data.replyText;
      } catch (err) {
        winstonLogger.warn(`AI call failed: ${(err as Error).message}`);
        reply = `You said: ${SpeechResult}.`;
      }
    }

    return this.buildSayAndGather(CallSid, reply);
  }

  handleStatus({ CallSid, CallStatus }: VoiceStatusBody): void {
    winstonLogger.log(
      'info',
      `[STATUS] CallSid=${CallSid}, status=${CallStatus}`,
    );
  }

  private buildSayAndGather(sid: string, text: string): string {
    const vr = new twiml.VoiceResponse();
    vr.say(text);
    vr.gather({
      input: ['speech'],
      language: 'en-AU',
      speechTimeout: 'auto',
      action: `${PUBLIC_URL}/telephony/gather?CallSid=${sid}`,
      method: 'POST',
    });
    return vr.toString() as string;
  }
}
