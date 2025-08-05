import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { Company } from '@/modules/company/schema/company.schema';
import { Service as ServiceDocument } from '@/modules/service/schema/service.schema';
import { User } from '@/modules/user/schema/user.schema';

import { SessionRepository } from '../repositories/session.repository';
import {
  CallSkeleton,
  Company as TelephonyCompany,
  Service,
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
    services: ServiceDocument[],
  ): Promise<void> {
    const telephonyServices: Service[] = services.map(service => ({
      id: (service as ServiceDocument & { _id: Types.ObjectId })._id.toString(),
      name: service.name,
      price: service.price,
      description: service.description,
    }));
    const session = await this.sessions.load(callSid);
    if (!session) {
      throw new Error('Session not found');
    }
    await this.sessions.appendServices(callSid, telephonyServices);
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
      calendar_access_token: undefined, // Optional field not available in Company schema
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
