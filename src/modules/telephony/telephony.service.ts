import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom, retry, timeout } from 'rxjs';

import { SYSTEM_RESPONSES } from '@/common/constants/system-responses.constant';
import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { winstonLogger } from '@/logger/winston.logger';
import {
  buildSayResponse,
  NextAction,
} from '@/modules/telephony/utils/twilio-response.util';

import { SessionHelper } from './helpers/session.helper';
import { SessionRepository } from './repositories/session.repository';

const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://your-domain/api';
const AI_TIMEOUT_MS = 5_000;
const AI_RETRY = 2;

@Injectable()
export class TelephonyService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly http: HttpService,
    private readonly sessionHelper: SessionHelper,
  ) {}
  async handleVoice({ CallSid }: VoiceGatherBody): Promise<string> {
    const session = await this.sessionHelper.ensureSession(CallSid);
    //把redis sessinon里面的company services填满

    const { services, company } = session;
    const welcome = this.buildWelcomeMessage(company.name, services);

    return this.speakAndLog(CallSid, welcome, NextAction.GATHER);
  }

  async handleGather({
    CallSid,
    SpeechResult = '',
  }: VoiceGatherBody): Promise<string> {
    await this.sessionHelper.ensureSession(CallSid);
    let reply: string = SYSTEM_RESPONSES.fallback;
    if (SpeechResult) {
      try {
        await this.sessionHelper.appendUserMessage(CallSid, SpeechResult);
        const aiReply = await this.getAIReply(CallSid, SpeechResult);
        reply = aiReply.trim() || SYSTEM_RESPONSES.fallback;
      } catch (err) {
        winstonLogger.error(
          `[TelephonyService][callSid=${CallSid}][handleGather] AI call failed`,
          { stack: (err as Error).stack },
        );
        reply = SYSTEM_RESPONSES.error;
      }
    }
    return this.speakAndLog(CallSid, reply, NextAction.GATHER);
  }
  async handleStatus({
    CallSid,
    CallStatus,
    Timestamp,
    CallDuration,
    Caller,
  }: VoiceStatusBody): Promise<void> {
    const FINAL_CALL_STATUSES = ['completed', 'canceled'];
    if (FINAL_CALL_STATUSES.includes(CallStatus)) {
      winstonLogger.log(
        `[TelephonyService][callSid=${CallSid}][handleStatus] status=${CallStatus},timestamp=${Timestamp},callDuration=${CallDuration},caller=${Caller}`,
      );
      //let serviceupload = false;
      //1，如果confirmservice为true，上传service拿到上传service的结果，成功或者失败，失败原因，或者不需要上传
      //2，生成summary 关于service的booking成功没成功还是不需要预定service，calllog的总结，通过调用ai接口（ai/summary）
      //3，把这个session里面的hisoty作为calllog,caller,timestamp,callDuration,上传到数据库：mark
      //4，将summary 和sid 发送给python 完成链路（调用callender-mcp，发送邮件-mcp）

      await this.sessions.delete(CallSid);
    }
    winstonLogger.log(
      `[TelephonyService][callSid=${CallSid}][handleStatus] status=${CallStatus}`,
    );
  }

  private async speakAndLog(
    callSid: string,
    text: string,
    next: NextAction,
  ): Promise<string> {
    await this.sessionHelper.appendAiMessage(callSid, text);

    return buildSayResponse({
      text,
      next,
      sid: callSid,
      publicUrl: PUBLIC_URL,
    });
  }
  private async getAIReply(callSid: string, message: string): Promise<string> {
    const { data } = await firstValueFrom(
      this.http
        .post<{ replyText: string }>('/ai/reply', { callSid, message })
        .pipe(timeout(AI_TIMEOUT_MS), retry(AI_RETRY)),
    );
    return data.replyText;
  }

  private buildWelcomeMessage(
    companyName?: string,
    services?: readonly { name: string }[],
  ): string {
    if (companyName !== undefined && services && services.length > 0) {
      const serviceList = services.map(s => s.name).join(', ');
      return `Welcome! We are ${companyName}. We provide ${serviceList}. How can I help you today?`;
    }
    return 'Welcome! How can I help you today?';
  }
}
