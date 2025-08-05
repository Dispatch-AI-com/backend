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
import { ServiceBookingDocument } from '@/modules/service-booking/schema/service-booking.schema';
import { ServiceBookingService } from '@/modules/service-booking/service-booking.service';
import { CreateTranscriptDto } from '@/modules/transcript/dto/create-transcript.dto';
import { TranscriptService } from '@/modules/transcript/transcript.service';
import { CreateTranscriptChunkDto } from '@/modules/transcript-chunk/dto/create-transcript-chunk.dto';
import { TranscriptChunkService } from '@/modules/transcript-chunk/transcript-chunk.service';

import { DataTransformerHelper } from '../helpers/data-transformer.helper';
import { ValidationHelper } from '../helpers/validation.helper';
import { SessionRepository } from '../repositories/session.repository';
import { CallSkeleton } from '../types/redis-session';
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
      const transcriptDto: CreateTranscriptDto = {
        callSid: session.callSid,
        summary: aiSummary.summary,
        keyPoints: aiSummary.keyPoints,
      };
      const chunkDtos: CreateTranscriptChunkDto[] =
        DataTransformerHelper.convertMessagesToChunks(session.history);
      await this.createTranscriptAndChunks(transcriptDto, chunkDtos);

      // Step 3: Create service booking if service was booked
      const serviceBooking = await this.createServiceBookingRecord(session);
      const serviceBookingId =
        serviceBooking._id != null
          ? String((serviceBooking as { _id: string })._id)
          : undefined;

      // Step 4: Create call log record (last step to include all data)
      const callLogDto: CreateCallLogDto = {
        callSid: session.callSid,
        userId: session.company.userId,
        serviceBookedId: serviceBookingId,
        callerNumber: twilioParams.Caller,
        callerName: session.user.userInfo.name ?? 'Unknown Caller',
        startAt: new Date(twilioParams.Timestamp),
      };
      await this.createCallLogRecord(callLogDto);

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
    callLogDto: CreateCallLogDto,
  ): Promise<ICallLog> {
    const callLog = await this.callLogService.create(callLogDto);
    winstonLogger.log(
      `[CallDataPersistenceService][createCallLogRecord] Created CallLog for ${callLogDto.callSid}`,
    );
    return callLog;
  }

  private async createTranscriptAndChunks(
    transcriptDto: CreateTranscriptDto,
    chunkDtos: CreateTranscriptChunkDto[],
  ): Promise<void> {
    // Create transcript record with AI-generated summary
    const transcript = await this.transcriptService.create(transcriptDto);

    // Create transcript chunks from conversation history
    if (chunkDtos.length > 0) {
      await this.transcriptChunkService.createMany(transcript._id, chunkDtos);
    }

    winstonLogger.log(
      `[CallDataPersistenceService][createTranscriptAndChunks] Created transcript and chunks for ${transcriptDto.callSid}`,
    );
  }

  private async createServiceBookingRecord(
    session: CallSkeleton,
  ): Promise<ServiceBookingDocument> {
    // Return early if no service was booked
    if (
      !session.servicebooked ||
      session.user.service == null ||
      session.user.serviceBookedTime == null
    ) {
      winstonLogger.log(
        `[CallDataPersistenceService][createServiceBookingRecord] No service booking required for ${session.callSid}`,
      );
      return {} as ServiceBookingDocument;
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
      winstonLogger.log(
        `[CallDataPersistenceService][createServiceBookingRecord] Service booking created successfully for ${session.callSid}, booking ID: ${String((serviceBooking as unknown as { _id: string })._id)}`,
      );
      return serviceBooking as ServiceBookingDocument;
    } catch (error) {
      winstonLogger.error(
        `[CallDataPersistenceService][createServiceBookingRecord] Failed to create service booking for ${session.callSid}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
      throw error;
    }
  }
}
