import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { twiml } from 'twilio';

import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { REDIS_CLIENT } from '@/lib/redis/redis.module';

import { CallSkeleton, Company, Service } from './types/redis-session';

const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://your-domain/api';
const SESSION_TTL = 60 * 30; // 30 min
const LOCK_TTL = 10_000; // 10 s

@Injectable()
export class TelephonyService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /* ---------- /voice ---------- */
  async handleVoice({ CallSid }: VoiceGatherBody): Promise<string> {
    const key = `call:${CallSid}`;

    /* 初始化骨架（仅一次） */
    if (!(await this.redis.exists(key))) {
      //todo: 查询公司和服务
      const skeleton: CallSkeleton = {
        callSid: CallSid,
        services: [],
        company: { id: '', name: '' },
        user: { userInfo: {} },
        history: [],
        serviceBooked: false,
        confirmEmailSent: false,
        createdAt: new Date().toISOString(),
      };
      await this.redis.set(key, JSON.stringify(skeleton), 'EX', SESSION_TTL);
    }

    const raw = await this.redis.get(key);
    if (!raw) return this.buildSayAndGather(CallSid, 'System error.');

    const { services = [], company = {} as Company } = JSON.parse(
      raw as string,
    ) as CallSkeleton;

    const welcome =
      services.length && company.name
        ? `Welcome! We are ${company.name}. We provide ${services
            .map((s: Service) => s.name)
            .join(', ')}. How can I help you today?`
        : 'Welcome! How can I help you today?';

    return this.buildSayAndGather(CallSid, welcome);
  }

  /* ---------- /gather ---------- */
  async handleGather({
    CallSid,
    SpeechResult = '',
  }: VoiceGatherBody): Promise<string> {
    /* 并发锁：重复回调直接忽略 */
    if (!(await this.redis.set(`lock:${CallSid}`, '1', 'PX', LOCK_TTL, 'NX'))) {
      return '';
    }

    // TODO: 调用 AI + 写 history
    const reply = `You said: ${SpeechResult}.`;
    return this.buildSayAndGather(CallSid, reply);
  }

  /* ---------- /status ---------- */
  async handleStatus({ CallSid, CallStatus }: VoiceStatusBody): Promise<void> {
    console.log(`[STATUS] CallSid=${CallSid}, status=${CallStatus}`);
  }

  /* ---------- 工具 ---------- */
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
