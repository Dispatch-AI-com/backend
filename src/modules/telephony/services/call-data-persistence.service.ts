import { Injectable } from '@nestjs/common';

import { ICallLog } from '@/common/interfaces/calllog';
import { VoiceStatusBody } from '@/common/interfaces/twilio-voice-webhook';
import { winstonLogger } from '@/logger/winston.logger';
import { CalllogService } from '@/modules/calllog/calllog.service';
import { CreateCallLogDto } from '@/modules/calllog/dto/create-calllog.dto';
import {
  CreateServiceBookingDto,
  ServiceBookingStatus,
} from '@/modules/service-booking/dto/create-service-booking.dto';
import { ServiceBookingService } from '@/modules/service-booking/service-booking.service';
import { CreateTranscriptDto } from '@/modules/transcript/dto/create-transcript.dto';
import { TranscriptService } from '@/modules/transcript/transcript.service';
import { CreateTranscriptChunkDto } from '@/modules/transcript-chunk/dto/create-transcript-chunk.dto';
import { TranscriptChunkService } from '@/modules/transcript-chunk/transcript-chunk.service';

import { DataTransformerHelper } from '../helpers/data-transformer.helper';
import { ValidationHelper } from '../helpers/validation.helper';
import { SessionRepository } from '../repositories/session.repository';
import { CallSkeleton, Message } from '../types/redis-session';
import { AiSummaryService } from './ai-summary.service';

@Injectable()
export class CallDataPersistenceService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly callLogService: CalllogService,
    private readonly transcriptService: TranscriptService,
    private readonly transcriptChunkService: TranscriptChunkService,
    private readonly serviceBookingService: ServiceBookingService,
    private readonly aiSummaryService: AiSummaryService,
  ) {}

  async processCallCompletion(
    callSid: string,
    twilioParams: VoiceStatusBody,
  ): Promise<void> {
    const session = await this.sessions.load(callSid);
    if (!session) {
      winstonLogger.warn(
        `[CallDataPersistenceService][processCallCompletion] Session not found for callSid: ${callSid}`,
      );
      return;
    }

    try {
      // Step 1: Generate AI summary first (independent operation)
      const aiSummary = await this.generateAISummaryForSession(session);

      // Step 2: Create transcript and chunks
      await this.createTranscriptAndChunks(
        session.callSid,
        aiSummary.summary,
        aiSummary.keyPoints,
        session.history,
      );

      // Step 3: Create service booking if service was booked
      const serviceBookingId = await this.createServiceBookingRecord(session);

      // Step 4: Create call log record (last step to include all data)
      await this.createCallLogRecord(
        session.callSid,
        session.company.userId,
        serviceBookingId,
        twilioParams.Caller,
        session.user.userInfo.name ?? 'Unknown Caller',
        new Date(twilioParams.Timestamp),
      );

      // Clean up Redis session
      await this.sessions.delete(callSid);

      winstonLogger.log(
        `[CallDataPersistenceService][processCallCompletion] Successfully processed call completion for ${callSid}`,
      );
    } catch (error) {
      winstonLogger.error(
        `[CallDataPersistenceService][processCallCompletion] Error processing call ${callSid}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
      throw error;
    }
  }

  private async generateAISummaryForSession(
    session: CallSkeleton,
  ): Promise<{ summary: string; keyPoints: string[] }> {
    try {
      const aiSummary = await this.aiSummaryService.generateSummary(
        session.callSid,
        session,
        {
          enableFallback: true,
          fallbackSummary: 'Call summary generation failed',
          fallbackKeyPoints: ['Summary could not be generated'],
        },
      );

      winstonLogger.log(
        `[CallDataPersistenceService][generateAISummaryForSession] Generated AI summary for ${session.callSid}`,
      );

      return aiSummary;
    } catch (error) {
      winstonLogger.error(
        `[CallDataPersistenceService][generateAISummaryForSession] Failed to generate AI summary for ${session.callSid}`,
        { error: (error as Error).message },
      );
      // Return fallback summary if generation fails
      return {
        summary: 'Call summary generation failed',
        keyPoints: ['Summary could not be generated'],
      };
    }
  }

  private async createCallLogRecord(
    callSid: string,
    userId: string,
    serviceBookedId: string | undefined,
    callerNumber: string,
    callerName: string,
    startAt: Date,
  ): Promise<ICallLog> {
    const callLogDto: CreateCallLogDto = {
      callSid,
      userId,
      serviceBookedId,
      callerNumber,
      callerName,
      startAt,
    };

    const callLog = await this.callLogService.create(callLogDto);
    winstonLogger.log(
      `[CallDataPersistenceService][createCallLogRecord] Created CallLog for ${callSid}`,
    );
    return callLog;
  }

  private async createTranscriptAndChunks(
    callSid: string,
    summary: string,
    keyPoints: string[],
    history: Message[],
  ): Promise<void> {
    // Create transcript DTO
    const transcriptDto: CreateTranscriptDto = {
      callSid,
      summary,
      keyPoints,
    };

    // Create transcript record with AI-generated summary
    const transcript = await this.transcriptService.create(transcriptDto);

    // Create transcript chunk DTOs from conversation history
    const chunkDtos: CreateTranscriptChunkDto[] =
      DataTransformerHelper.convertMessagesToChunks(history);

    // Create transcript chunks from conversation history
    if (chunkDtos.length > 0) {
      await this.transcriptChunkService.createMany(transcript._id, chunkDtos);
    }

    winstonLogger.log(
      `[CallDataPersistenceService][createTranscriptAndChunks] Created transcript and chunks for ${callSid}`,
    );
  }

  private async createServiceBookingRecord(
    session: CallSkeleton,
  ): Promise<string | undefined> {
    // Return early if no service was booked
    if (
      !session.servicebooked ||
      session.user.service == null ||
      session.user.serviceBookedTime == null
    ) {
      winstonLogger.log(
        `[CallDataPersistenceService][createServiceBookingRecord] No service booking required for ${session.callSid}`,
      );
      return undefined;
    }

    // Get customer address string (simplified address structure)
    const userInfo = session.user.userInfo;
    const addressString = ValidationHelper.getFallbackAddress(userInfo.address);

    // Create service booking data
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
      note: `Service booked via phone call.`,
      userId: session.company.userId,
      callSid: session.callSid,
    };

    try {
      const serviceBooking =
        await this.serviceBookingService.create(serviceBookingData);
      const serviceBookingId = String(
        (serviceBooking as unknown as { _id: string })._id,
      );

      winstonLogger.log(
        `[CallDataPersistenceService][createServiceBookingRecord] Service booking created successfully for ${session.callSid}, booking ID: ${serviceBookingId}`,
      );
      return serviceBookingId;
    } catch (error) {
      winstonLogger.error(
        `[CallDataPersistenceService][createServiceBookingRecord] Failed to create service booking for ${session.callSid}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
      throw error;
    }
  }
}
