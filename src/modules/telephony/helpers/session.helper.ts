import { Injectable } from '@nestjs/common';

import { Company } from '@/modules/company/schema/company.schema';

import { SessionRepository } from '../repositories/session.repository';
import {
  CallSkeleton,
  Company as TelephonyCompany,
  Service as TelephonyService,
} from '../types/redis-session';

@Injectable()
export class SessionHelper {
  constructor(private readonly sessions: SessionRepository) {}

  async ensureSession(callSid: string): Promise<CallSkeleton> {
    let session = await this.sessions.load(callSid);
    session ??= await this.sessions.create(callSid);
    return session;
  }

  async fillCompanyServices(
    callSid: string,
    services: TelephonyService[],
  ): Promise<void> {
    const session = await this.sessions.load(callSid);
    if (!session) {
      throw new Error('Session not found');
    }
    await this.sessions.appendServices(callSid, services);
  }

  async appendUserMessage(callSid: string, message: string): Promise<void> {
    await this.appendMessage(callSid, 'customer', message);
  }
  async appendAiMessage(callSid: string, message: string): Promise<void> {
    await this.appendMessage(callSid, 'AI', message);
  }

  async fillCompany(callSid: string, company: Company): Promise<void> {
    const telephonyCompany: TelephonyCompany = {
      id: company._id.toString(),
      name: company.businessName,
      email: company.email,
    };
    await this.sessions.appendCompany(callSid, telephonyCompany);
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
