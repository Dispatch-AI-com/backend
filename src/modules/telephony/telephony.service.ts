import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom, retry, timeout } from 'rxjs';

import { CallLogStatus } from '@/common/constants/calllog.constant';
import { SYSTEM_RESPONSES } from '@/common/constants/system-responses.constant';
import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { winstonLogger } from '@/logger/winston.logger';
import { CalllogService } from '@/modules/calllog/calllog.service';
import {
  buildSayResponse,
  NextAction,
} from '@/modules/telephony/utils/twilio-response.util';
import { TranscriptService } from '@/modules/transcript/transcript.service';
import { TranscriptChunkService } from '@/modules/transcript-chunk/transcript-chunk.service';

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
  ) {}
  async handleVoice({ CallSid }: VoiceGatherBody): Promise<string> {
    const session = await this.sessionHelper.ensureSession(CallSid);

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

      // Step 3: 如果confirmservice为true，上传service（暂时跳过，按注释保留）
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
}
