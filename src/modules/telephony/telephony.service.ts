import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom, retry, timeout } from 'rxjs';

import { CallLogStatus } from '@/common/constants/calllog.constant';
import { SYSTEM_RESPONSES } from '@/common/constants/system-responses.constant';
import { ICallLog } from '@/common/interfaces/calllog';
import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { winstonLogger } from '@/logger/winston.logger';
import { CalllogService } from '@/modules/calllog/calllog.service';
import { CompanyService } from '@/modules/company/company.service';
import { ServiceService } from '@/modules/service/service.service';
import {
  CreateServiceBookingDto,
  ServiceBookingStatus,
} from '@/modules/service-booking/dto/create-service-booking.dto';
import { ServiceBookingDocument } from '@/modules/service-booking/schema/service-booking.schema';
import { ServiceBookingService } from '@/modules/service-booking/service-booking.service';
import {
  buildSayResponse,
  NextAction,
} from '@/modules/telephony/utils/twilio-response.util';
import { TranscriptService } from '@/modules/transcript/transcript.service';
import { TranscriptChunkService } from '@/modules/transcript-chunk/transcript-chunk.service';
import { UserService } from '@/modules/user/user.service';

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
    private readonly userService: UserService,
    private readonly serviceService: ServiceService,
    private readonly companyService: CompanyService,
    private readonly serviceBookingService: ServiceBookingService,
  ) {}
  async handleVoice({ CallSid, To }: VoiceGatherBody): Promise<string> {
    await this.sessionHelper.ensureSession(CallSid);
    const user = await this.userService.findByTwilioPhoneNumber(To);
    if (user == null) {
      return this.speakAndLog(CallSid, 'User not found', NextAction.GATHER);
    }
    const services = await this.serviceService.findAllActiveByUserId(
      user._id as string,
    );
    await this.sessionHelper.fillCompanyServices(CallSid, services);

    const company = await this.companyService.findByUserId(user._id as string);
    await this.sessionHelper.fillCompany(CallSid, company);

    const welcome = this.buildWelcomeMessage(company.businessName, services);

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
        const aiReplyData = await this.getAIReply(CallSid, SpeechResult);
        reply = aiReplyData.message.trim() || SYSTEM_RESPONSES.fallback;

        // Check if AI indicates conversation should end
        if (aiReplyData.shouldHangup === true) {
          winstonLogger.log(
            `[TelephonyService][callSid=${CallSid}][handleGather] AI indicates conversation complete, hanging up`,
          );
          return await this.speakAndLog(CallSid, reply, NextAction.HANGUP);
        }
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
  private async getAIReply(
    callSid: string,
    message: string,
  ): Promise<{ message: string; shouldHangup?: boolean }> {
    const { data } = await firstValueFrom(
      this.http
        .post<{ aiResponse: { message: string }; shouldHangup?: boolean }>(
          '/ai/conversation',
          {
            callSid,
            customerMessage: {
              speaker: 'customer',
              message,
              startedAt: new Date().toISOString(),
            },
          },
        )
        .pipe(timeout(AI_TIMEOUT_MS), retry(AI_RETRY)),
    );
    return {
      message: data.aiResponse.message,
      shouldHangup: data.shouldHangup,
    };
  }

  private buildWelcomeMessage(
    companyName?: string,
    services?: readonly { name: string }[],
  ): string {
    if (companyName !== undefined && services && services.length > 0) {
      const serviceList = services.map(s => s.name).join(', ');
      return `Welcome! We are ${companyName}. We provide ${serviceList}. May I get your name please?`;
    }
    return 'Welcome! How can I help you today? May I get your name please?';
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
      const callLog = await this.createCallLogRecord(session, twilioParams);

      // Step 2: 生成summary 关于service的booking成功没成功还是不需要预定service，calllog的总结
      await this.createTranscriptAndChunks(session);

      // Step 3: 如果confirmservice为true，上传service booking到数据库
      if (session.servicebooked && session.user.service) {
        const serviceBooking = await this.createServiceBookingRecord(session);
        // Step 4: 更新calllog的serviceBookedId为实际的booking ID
        if (callLog._id != null) {
          await this.updateCallLogWithBookingId(
            callLog._id,
            String((serviceBooking as any)._id),
            session.company.userId,
          );
        }
      }

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
  ): Promise<ICallLog> {
    const callLogData = {
      callSid: session.callSid,
      userId: session.company.userId,
      serviceBookedId: session.user.service?.id,
      callerNumber: twilioParams.Caller,
      callerName: session.user.userInfo.name,
      status: this.determineCallLogStatus(session),
      startAt: new Date(twilioParams.Timestamp),
    };

    const callLog = await this.callLogService.create(callLogData);
    winstonLogger.log(
      `[TelephonyService][createCallLogRecord] Created CallLog for ${session.callSid}`,
    );
    return callLog;
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
    if (session.servicebooked && session.user.service) {
      return CallLogStatus.Done;
    }
    if (session.user.service && !session.servicebooked) {
      return CallLogStatus.Confirmed;
    }
    return CallLogStatus.Cancelled;
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
      booked: Boolean(session.servicebooked),
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

  private async createServiceBookingRecord(
    session: CallSkeleton,
  ): Promise<ServiceBookingDocument> {
    if (
      session.user.service == null ||
      session.user.serviceBookedTime == null
    ) {
      winstonLogger.warn(
        `[TelephonyService][createServiceBookingRecord] Missing service or booking time for ${session.callSid}`,
      );
      return {} as ServiceBookingDocument;
    }

    // 构建客户地址字符串
    const userInfo = session.user.userInfo;
    const address = userInfo.address;
    let addressString = 'Address not provided';

    if (address != null) {
      const addressParts = [
        address.street_number != null && address.street_name != null
          ? `${address.street_number} ${address.street_name}`
          : null,
        address.suburb,
        address.state,
        address.postcode,
      ].filter(Boolean);

      if (addressParts.length > 0) {
        addressString = addressParts.join(', ');
      }
    }

    // 构建service booking数据
    const serviceBookingData: CreateServiceBookingDto = {
      serviceId: session.user.service.id,
      client: {
        name: userInfo.name ?? 'Name not provided',
        phoneNumber: userInfo.phone ?? 'Phone not provided',
        address: addressString,
      },
      serviceFormValues: [
        {
          serviceFieldId: 'booking_source',
          answer: 'Phone Call',
        },
        {
          serviceFieldId: 'call_sid',
          answer: session.callSid,
        },
      ],
      bookingTime: session.user.serviceBookedTime,
      status: ServiceBookingStatus.Confirmed,
      note: `Service booked via phone call. CallSid: ${session.callSid}`,
      userId: session.company.userId,
      callSid: session.callSid,
    };

    try {
      const serviceBooking =
        await this.serviceBookingService.create(serviceBookingData);
      winstonLogger.log(
        `[TelephonyService][createServiceBookingRecord] Service booking created successfully for ${session.callSid}, booking ID: ${String((serviceBooking as any)._id)}`,
      );
      return serviceBooking as ServiceBookingDocument;
    } catch (error) {
      winstonLogger.error(
        `[TelephonyService][createServiceBookingRecord] Failed to create service booking for ${session.callSid}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
      throw error;
    }
  }

  private async updateCallLogWithBookingId(
    callLogId: string,
    serviceBookingId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.callLogService.update(userId, callLogId, {
        serviceBookedId: serviceBookingId,
      });
      winstonLogger.log(
        `[TelephonyService][updateCallLogWithBookingId] Updated CallLog ${callLogId} with ServiceBooking ID ${serviceBookingId}`,
      );
    } catch (error) {
      winstonLogger.error(
        `[TelephonyService][updateCallLogWithBookingId] Failed to update CallLog ${callLogId}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
      // Don't throw - this is not critical enough to fail the whole process
    }
  }
}
