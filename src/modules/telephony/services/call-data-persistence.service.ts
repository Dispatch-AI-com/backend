import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

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
import {
  CallSkeleton,
  Message,
  Service,
  UserInfo,
} from '../types/redis-session';
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
    private readonly http: HttpService,
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
      const aiSummary = await this.generateAISummaryForSession(
        session.callSid,
        session,
      );

      // Step 2: Create service booking if service was booked
      const serviceBookingId = await this.createServiceBookingRecord(
        session.callSid,
        session.servicebooked,
        session.user.service,
        session.user.serviceBookedTime,
        session.user.userInfo,
        session.company.userId,
      );

      // Step 3: Create call log record (last step to include all data)
      await this.createCallLogRecord(
        session.callSid,
        session.company.userId,
        serviceBookingId,
        twilioParams.Caller,
        session.user.userInfo.name ?? 'Unknown Caller',
        new Date(twilioParams.Timestamp),
      );

      // Step 4: Create transcript and chunks
      await this.createTranscriptAndChunks(
        session.callSid,
        aiSummary.summary,
        aiSummary.keyPoints,
        session.history,
      );

      await firstValueFrom(
        this.http.post('/dispatch/send-email-and-calendar', {
          to: session.company.email,
          subject: 'Service Booking Confirmation',
          body: aiSummary.summary,
          summary: session.user.service?.name ?? 'Service Booking',
          start: session.user.serviceBookedTime ?? new Date().toISOString(),
          end:
            session.user.serviceBookedTime != null &&
            session.user.serviceBookedTime.trim() !== ''
              ? new Date(
                  new Date(session.user.serviceBookedTime).getTime() +
                    60 * 60 * 1000,
                ).toISOString()
              : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          description:
            (session.user.userInfo.name ?? 'Customer') +
            ' has ordered ' +
            (session.user.service?.name ?? 'service') +
            ' at ' +
            (session.user.serviceBookedTime ?? 'scheduled time') +
            ' at ' +
            ValidationHelper.getFallbackAddress(
              session.user.userInfo.address ?? 'specified location',
            ),
          location: ValidationHelper.getFallbackAddress(
            session.user.userInfo.address,
          ),
          attendees: [session.company.email],
          alarm_minutes_before: 10,
          calendarapp: 'none',
        }),
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
    callSid: string,
    session: CallSkeleton,
  ): Promise<{ summary: string; keyPoints: string[] }> {
    try {
      const aiSummary = await this.aiSummaryService.generateSummary(
        callSid,
        session,
        {
          enableFallback: true,
          fallbackSummary: 'Call summary generation failed',
          fallbackKeyPoints: ['Summary could not be generated'],
        },
      );

      winstonLogger.log(
        `[CallDataPersistenceService][generateAISummaryForSession] Generated AI summary for ${callSid}`,
      );

      return aiSummary;
    } catch (error) {
      winstonLogger.error(
        `[CallDataPersistenceService][generateAISummaryForSession] Failed to generate AI summary for ${callSid}`,
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
    callSid: string,
    servicebooked: boolean,
    service: Service | undefined,
    serviceBookedTime: string | undefined,
    userInfo: Partial<UserInfo>,
    userId: string,
  ): Promise<string | undefined> {
    // Return early if no service was booked
    if (!servicebooked || service == null || serviceBookedTime == null) {
      winstonLogger.log(
        `[CallDataPersistenceService][createServiceBookingRecord] No service booking required for ${callSid}`,
      );
      return undefined;
    }

    // Get customer address string (simplified address structure)
    const addressString = ValidationHelper.getFallbackAddress(userInfo.address);

    // Create service booking data
    const serviceBookingData: CreateServiceBookingDto = {
      serviceId: service.id,
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
          answer: callSid,
        },
      ],
      bookingTime: serviceBookedTime,
      status: ServiceBookingStatus.Confirmed,
      note: `Service booked via phone call.`,
      userId: userId,
      callSid: callSid,
    };

    try {
      const serviceBooking =
        await this.serviceBookingService.create(serviceBookingData);
      const serviceBookingId = String(
        (serviceBooking as unknown as { _id: string })._id,
      );

      winstonLogger.log(
        `[CallDataPersistenceService][createServiceBookingRecord] Service booking created successfully for ${callSid}, booking ID: ${serviceBookingId}`,
      );
      return serviceBookingId;
    } catch (error) {
      winstonLogger.error(
        `[CallDataPersistenceService][createServiceBookingRecord] Failed to create service booking for ${callSid}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
      throw error;
    }
  }
}
