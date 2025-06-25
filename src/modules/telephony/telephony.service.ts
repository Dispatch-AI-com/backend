import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { twiml } from 'twilio';

import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { REDIS_CLIENT } from '@/lib/redis/redis.module';
import { winstonLogger } from '@/logger/winston.logger';

import { CallSkeleton, Company, Service } from './types/redis-session';

const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://your-domain/api';
const SESSION_TTL = 60 * 30;

@Injectable()
export class TelephonyService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
  async handleVoice({ CallSid }: VoiceGatherBody): Promise<string> {
    const key = `call:${CallSid}`;
    if ((await this.redis.exists(key)) === 0) {
      //todo: 查询公司和服务
      const skeleton: CallSkeleton = {
        callSid: CallSid,
        services: [],
        company: { id: '', name: '' },
        user: { service: undefined, userInfo: {} },
        history: [],
        serviceBooked: false,
        confirmEmailSent: false,
        createdAt: new Date().toISOString(),
      };
      await this.redis.set(key, JSON.stringify(skeleton), 'EX', SESSION_TTL);
    }

    let session: CallSkeleton;
    try {
      session = JSON.parse(
        (await this.redis.get(key)) as string,
      ) as CallSkeleton;
    } catch (err) {
      winstonLogger.error(`[STATUS] ${CallSid} → ${err as string}`);
      return this.buildSayAndGather(CallSid, 'System error.');
    }

    const { services, company } = session;
    const welcome =
      services.length && company.name
        ? `Welcome! We are ${company.name}. We provide ${services.map(s => s.name).join(', ')}. How can I help you today?`
        : 'Welcome! How can I help you today?';

    return this.buildSayAndGather(CallSid, welcome);
  }

  handleGather({ CallSid, SpeechResult = '' }: VoiceGatherBody): string {
    // TODO: 调用 AI + 写 history
    const reply = `You said: ${SpeechResult}.`;
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
