import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom, retry, timeout } from 'rxjs';

import { CallLogStatus } from '@/common/constants/calllog.constant';
import { SYSTEM_RESPONSES } from '@/common/constants/system-responses.constant';
import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook.d';
import { winstonLogger } from '@/logger/winston.logger';
import { CalllogService } from '@/modules/calllog/calllog.service';
import {
  buildSayResponse,
  NextAction,
} from '@/modules/telephony/utils/twilio-response.util';
import { TranscriptService } from '@/modules/transcript/transcript.service';
import { TranscriptChunkService } from '@/modules/transcript-chunk/transcript-chunk.service';
import { CompanyService } from '@/modules/company/company.service';
import { ServiceService } from '@/modules/service/service.service';

import { SessionHelper } from './helpers/session.helper';
import { SessionRepository } from './repositories/session.repository';
import { CallSkeleton, Message } from './types/redis-session';

const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://your-domain/api';
const AI_TIMEOUT_MS = 5_000;
const AI_RETRY = 2;

@Injectable()
export class TelephonyService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly http: HttpService,
    private readonly sessionHelper: SessionHelper,
    private readonly callLogService: CalllogService,
    private readonly transcriptService: TranscriptService,
    private readonly transcriptChunkService: TranscriptChunkService,
    private readonly companyService: CompanyService,
    private readonly serviceService: ServiceService,
  ) {}
  async handleVoice({ CallSid, To }: VoiceGatherBody): Promise<string> {
    const session = await this.sessionHelper.ensureSession(CallSid);

    // Populate company & service context if missing
    try {
      await this.populateSessionContext(session, To);
    } catch (err) {
      winstonLogger.warn(
        `[TelephonyService][callSid=${CallSid}][handleVoice] Failed to populate session context: ${(err as Error).message}`,
      );
    }

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

      try {
        await this.processCallCompletion(CallSid, {
          CallSid,
          CallStatus,
          Timestamp,
          CallDuration,
          Caller,
        });
      } catch (error) {
        winstonLogger.error(
          `[TelephonyService][callSid=${CallSid}][handleStatus] Failed to process call completion`,
          { error: (error as Error).message, stack: (error as Error).stack },
        );
      }
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
        .post<{
          replyText: string;
        }>('/ai/reply', { callSid, message })
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

  private async processCallCompletion(
    callSid: string,
    twilioParams: VoiceStatusBody,
  ): Promise<void> {
    const session = await this.sessions.load(callSid);
    if (!session) {
      winstonLogger.warn(
        `[TelephonyService][processCallCompletion] Session not found for callSid: ${callSid}`,
      );
      return;
    }

    try {
      // Step 1: 把这个session里面的history作为calllog,caller,timestamp,callDuration,上传到数据库
      await this.createCallLogRecord(session, twilioParams);

      // Step 2: 生成summary 关于service的booking成功没成功还是不需要预定service，calllog的总结
      await this.createTranscriptAndChunks(session);

      // Step 3: 如果confirmBooking为true，则将选定的service信息持久化到Redis
      await this.uploadConfirmedService(session);

      // Step 4: 将summary和sid发送给python完成链路（暂时跳过，按注释保留）

      // 清理Redis会话
      await this.sessions.delete(callSid);

      winstonLogger.log(
        `[TelephonyService][processCallCompletion] Successfully processed call completion for ${callSid}`,
      );
    } catch (error) {
      winstonLogger.error(
        `[TelephonyService][processCallCompletion] Error processing call ${callSid}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
      throw error;
    }
  }

  private async createCallLogRecord(
    session: CallSkeleton,
    twilioParams: VoiceStatusBody,
  ): Promise<void> {
    const callLogData = {
      callSid: session.callSid,
      userId: session.company.id,
      serviceBookedId: session.user.service?.id,
      callerNumber: twilioParams.Caller,
      callerName: session.user.userInfo.name,
      status: this.determineCallLogStatus(session),
      startAt: new Date(twilioParams.Timestamp),
    };

    await this.callLogService.create(callLogData);
    winstonLogger.log(
      `[TelephonyService][createCallLogRecord] Created CallLog for ${session.callSid}`,
    );
  }

  private async createTranscriptAndChunks(
    session: CallSkeleton,
  ): Promise<void> {
    // 创建Transcript占位记录
    const transcript = await this.transcriptService.create({
      callSid: session.callSid,
      summary: 'Transcript summary', // 将通过AI生成
      keyPoints: [],
    });

    // 转换会话历史为TranscriptChunk
    const chunks = this.convertMessagesToChunks(session.history);
    if (chunks.length > 0) {
      await this.transcriptChunkService.createMany(transcript._id, chunks);
    }

    // 生成AI摘要
    try {
      const aiSummary = await this.generateAISummary(session.callSid, session);
      await this.transcriptService.update(transcript._id, aiSummary);
      winstonLogger.log(
        `[TelephonyService][createTranscriptAndChunks] Generated AI summary for ${session.callSid}`,
      );
    } catch (error) {
      winstonLogger.error(
        `[TelephonyService][createTranscriptAndChunks] Failed to generate AI summary for ${session.callSid}`,
        { error: (error as Error).message },
      );
    }
  }

  private determineCallLogStatus(session: CallSkeleton): CallLogStatus {
    if (session.confirmBooking && session.user.service) {
      return CallLogStatus.Completed;
    }
    if (session.user.service && !session.confirmBooking) {
      return CallLogStatus.FollowUp;
    }
    return CallLogStatus.Missed;
  }

  private convertMessagesToChunks(messages: Message[]): {
    speakerType: 'AI' | 'User';
    text: string;
    startAt: number;
  }[] {
    return messages.map((msg, index) => ({
      speakerType: msg.speaker === 'AI' ? 'AI' : 'User',
      text: msg.message,
      startAt: new Date(msg.startedAt).getTime() + index, // 确保唯一性
    }));
  }

  private async generateAISummary(
    callSid: string,
    session: CallSkeleton,
  ): Promise<{
    summary: string;
    keyPoints: string[];
  }> {
    // Prepare conversation data for AI analysis
    const conversation = session.history.map(msg => ({
      speaker: msg.speaker === 'AI' ? 'AI' : 'customer',
      message: msg.message,
      timestamp: msg.startedAt,
    }));

    // Prepare service information
    const serviceInfo = {
      name:
        session.user.service?.name ??
        (session.services.length > 0 ? session.services[0].name : null) ??
        'general inquiry',
      booked: Boolean(session.confirmBooking),
      company: session.company.name,
    };

    const requestData = {
      callSid,
      conversation,
      serviceInfo,
    };

    const { data } = await firstValueFrom(
      this.http
        .post<{
          summary: string;
          keyPoints: string[];
        }>('/ai/summary', requestData)
        .pipe(timeout(AI_TIMEOUT_MS), retry(AI_RETRY)),
    );
    return data;
  }

  /**
   * When a new voice session starts, attempt to hydrate Redis session with
   * company & service data based on the Twilio destination phone number.
   * Skips if information already present or essential input missing.
   */
  private async populateSessionContext(
    session: CallSkeleton,
    toPhoneNumber?: string,
  ): Promise<void> {
    if (session.company.id && session.services.length > 0) {
      // Already populated
      return;
    }

    if (!toPhoneNumber) {
      winstonLogger.warn(
        `[TelephonyService][populateSessionContext] Missing 'To' phone number, cannot resolve company`,
      );
      return;
    }

    try {
      const companyEntity = await this.companyService.findByTwilioPhoneNumber(
        toPhoneNumber,
      );

      if (!companyEntity || !(companyEntity as any)._id || !companyEntity.email) {
        winstonLogger.warn(
          `[TelephonyService][populateSessionContext] Incomplete company data for number ${toPhoneNumber}`,
        );
        return;
      }

      // Map company entity to lightweight DTO stored in Redis session
      session.company = {
        id: (companyEntity as any)._id.toString(),
        name:
          (companyEntity as any).businessName ?? (companyEntity as any).name ?? '',
        email: companyEntity.email,
        calendar_access_token: (companyEntity as any).calendar_access_token,
        description: (companyEntity as any).description,
      } as any; // Cast to satisfy extended interface

      // Fetch services
      const services = await this.serviceService.findByCompanyId(
        session.company.id,
      );

      (session as any).services = services.map(s => ({
        id: (s as any)._id?.toString?.() ?? (s as any).id ?? '',
        name: s.name,
        price: s.price ?? null,
        description: s.description,
      }));

      // Persist updated session to Redis
      await this.sessions.save(session);

      winstonLogger.log(
        `[TelephonyService][populateSessionContext] Populated company & services for callSid=${session.callSid}`,
      );
    } catch (error) {
      winstonLogger.error(
        `[TelephonyService][populateSessionContext] Failed to populate context for callSid=${session.callSid}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
    }
  }

  /**
   * Conditionally persists the selected Service into Redis based on
   * confirmBooking flag.
   * Returns structured result for logging & further processing.
   */
  private async uploadConfirmedService(
    session: CallSkeleton,
  ): Promise<{ success: boolean; message: string }> {
    const identifier = `[TelephonyService][uploadConfirmedService][callSid=${session.callSid}]`;

    if (!session.confirmBooking) {
      const msg = 'confirmBooking flag is false; skipping service upload';
      winstonLogger.log(`${identifier} ${msg}`);
      return { success: false, message: msg };
    }

    if (!session.user.service) {
      const msg = 'No service selected; nothing to upload';
      winstonLogger.warn(`${identifier} ${msg}`);
      return { success: false, message: msg };
    }

    try {
      // At this point service has already been written into session object.
      // Persist entire session to Redis to ensure the latest state is stored.
      await this.sessions.save(session);

      winstonLogger.log(`${identifier} Service uploaded successfully`);
      return { success: true, message: 'Uploaded' };
    } catch (error) {
      const errMsg = `Failed to upload service: ${(error as Error).message}`;
      winstonLogger.error(`${identifier} ${errMsg}`, {
        stack: (error as Error).stack,
      });
      return { success: false, message: errMsg };
    }
  }
}
