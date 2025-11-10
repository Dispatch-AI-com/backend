import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { Company } from '@/modules/company/schema/company.schema';
import { User } from '@/modules/user/schema/user.schema';

import { SessionRepository } from '../repositories/session.repository';
import {
  CallSkeleton,
  Company as TelephonyCompany,
} from '../types/redis-session';

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

  async fillCompany(
    callSid: string,
    company: Company,
    user: User,
  ): Promise<void> {
    const telephonyCompany: TelephonyCompany = {
      id: company._id.toString(),
      name: company.businessName,
      email: user.email,
      userId:
        typeof company.user === 'object' && '_id' in company.user
          ? (company.user as User & { _id: Types.ObjectId })._id.toString()
          : (company.user as Types.ObjectId).toString(),
    };
    await this.sessions.appendCompany(callSid, telephonyCompany);
  }

  async setCallerInfo(
    callSid: string,
    callerNumber: string,
    callStartAt: string,
  ): Promise<void> {
    const session = await this.sessions.load(callSid);
    if (!session) {
      throw new Error('Session not found');
    }
    session.callerNumber = callerNumber;
    session.callStartAt = callStartAt;
    await this.sessions.save(session);
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
