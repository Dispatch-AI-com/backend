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
const SESSION_TTL = 60 * 30;

@Injectable()
export class TelephonyService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
  async handleVoice({ CallSid }: VoiceGatherBody): Promise<string> {
    const key = `call:${CallSid}`;

    /* 初始化骨架（仅一次） */
    if ((await this.redis.exists(key)) === 0) {
      const dummyCompany: Company = { id: 'cmp_demo', name: 'Demo Plumbing' };
      const dummyServices: Service[] = [
        {
          id: 'srv1',
          name: 'Leak Repair',
          price: 120,
          description: 'Fix pipe leaks',
        },
        { id: 'srv2', name: 'Drain Cleaning', price: 90 },
      ];
      //todo: 查询公司和服务
      const skeleton: CallSkeleton = {
        callSid: CallSid,
        services: dummyServices,
        company: dummyCompany,
        user: { userInfo: {} },
        history: [],
        serviceBooked: false,
        confirmEmailSent: false,
        createdAt: new Date().toISOString(),
      };
      await this.redis.set(key, JSON.stringify(skeleton), 'EX', SESSION_TTL);
    }

    const raw = await this.redis.get(key);
    if (raw === null) return this.buildSayAndGather(CallSid, 'System error.');

    const { services = [], company = {} as Company } = JSON.parse(
      raw as string,
    ) as CallSkeleton;

    const welcome =
      services.length > 0
        ? `Welcome! We are ${company.name}. We provide ${services
            .map((s: Service) => s.name)
            .join(', ')}. How can I help you today?`
        : 'Welcome! How can I help you today?';

    return this.buildSayAndGather(CallSid, welcome);
  }

  handleGather({ CallSid, SpeechResult = '' }: VoiceGatherBody): string {
    // TODO: 调用 AI + 写 history
    const reply = `You said: ${SpeechResult}.`;
    return this.buildSayAndGather(CallSid, reply);
  }

  handleStatus({ CallSid, CallStatus }: VoiceStatusBody): void {
    console.log(`[STATUS] CallSid=${CallSid}, status=${CallStatus}`);
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
