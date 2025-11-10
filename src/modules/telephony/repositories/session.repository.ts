// src/modules/telephony/repositories/session.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '@/lib/redis/redis.module';
import {
  CallSkeleton,
  Company,
  Message,
} from '@/modules/telephony/types/redis-session';

import { createEmptySkeleton } from '../factories/call-skeleton.factory';

const SESSION_PREFIX = 'call:';
const SESSION_TTL = 60 * 30; // 30 min

@Injectable()
export class SessionRepository {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async load(callSid: string): Promise<CallSkeleton | null> {
    const raw: string | null = await this.redis.get(this.key(callSid));
    return raw !== null ? (JSON.parse(raw) as CallSkeleton) : null;
  }

  async create(callSid: string): Promise<CallSkeleton> {
    const skeleton = createEmptySkeleton(callSid);
    await this.redis.set(
      this.key(callSid),
      JSON.stringify(skeleton),
      'EX',
      SESSION_TTL,
    );
    return skeleton;
  }

  async save(session: CallSkeleton): Promise<void> {
    await this.redis.set(
      this.key(session.callSid),
      JSON.stringify(session),
      'EX',
      SESSION_TTL,
    );
  }

  async delete(callSid: string): Promise<void> {
    await this.redis.del(this.key(callSid));
  }

  async appendHistory(callSid: string, entry: Message): Promise<void> {
    const session = await this.load(callSid);
    if (!session) return;

    session.history.push(entry);
    await this.save(session);
  }

  async appendCompany(callSid: string, company: Company): Promise<void> {
    const session = await this.load(callSid);
    if (!session) return;
    session.company = company;
    await this.save(session);
  }

  private key(callSid: string): string {
    return `${SESSION_PREFIX}${callSid}`;
  }
}
