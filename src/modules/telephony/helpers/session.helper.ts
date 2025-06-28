import { Injectable } from '@nestjs/common';

import { SessionRepository } from '../repositories/session.repository';
import { CallSkeleton } from '../types/redis-session';

@Injectable()
export class SessionHelper {
  constructor(private readonly sessions: SessionRepository) {}

  async ensureSession(callSid: string): Promise<CallSkeleton> {
    let session = await this.sessions.load(callSid);
    session ??= await this.sessions.create(callSid);
    return session;
  }

  async appendUserMessage(callSid: string, message: string): Promise<void> {
    await this.appendMessage(callSid, 'customer', message);
  }
  async appendAiMessage(callSid: string, message: string): Promise<void> {
    await this.appendMessage(callSid, 'AI', message);
  }
  private async appendMessage(
    callSid: string,
    speaker: 'AI' | 'customer',
    message: string,
  ): Promise<void> {
    await this.sessions.appendHistory(callSid, {
      speaker,
      message,
      startedAt: new Date().toISOString(),
    });
  }
}
