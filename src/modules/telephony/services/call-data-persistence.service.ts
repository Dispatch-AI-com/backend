import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { ICallLog } from '@/common/interfaces/calllog';
import { VoiceStatusBody } from '@/common/interfaces/twilio-voice-webhook';
import { winstonLogger } from '@/logger/winston.logger';
import { CalllogService } from '@/modules/calllog/calllog.service';
import {
  CreateServiceBookingDto,
  ServiceBookingStatus,
} from '@/modules/service-booking/dto/create-service-booking.dto';
import { ServiceBookingDocument } from '@/modules/service-booking/schema/service-booking.schema';
import { ServiceBookingService } from '@/modules/service-booking/service-booking.service';
import { TranscriptService } from '@/modules/transcript/transcript.service';
import { TranscriptChunkService } from '@/modules/transcript-chunk/transcript-chunk.service';

import { DataTransformerHelper } from '../helpers/data-transformer.helper';
import { ValidationHelper } from '../helpers/validation.helper';
import { SessionRepository } from '../repositories/session.repository';
import { CallSkeleton } from '../types/redis-session';
import { AiIntegrationService } from './ai-integration.service';

@Injectable()
export class CallDataPersistenceService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly callLogService: CalllogService,
    private readonly transcriptService: TranscriptService,
    private readonly transcriptChunkService: TranscriptChunkService,
    private readonly serviceBookingService: ServiceBookingService,
    private readonly aiIntegration: AiIntegrationService,
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
      // Step 1: Create call log record
      const callLog = await this.createCallLogRecord(session, twilioParams);

      // Step 2: Generate transcript and chunks with AI summary
      await this.createTranscriptAndChunks(session);

      // Step 3: Create service booking if service was booked
      if (ValidationHelper.isServiceAvailable(session)) {
        const serviceBooking = await this.createServiceBookingRecord(session);
        // Step 4: Update call log with booking ID
        if (callLog._id != null) {
          await this.updateCallLogWithBookingId(
            callLog._id,
            String((serviceBooking as any)._id),
            session.company.userId,
          );
        }
      }

      await firstValueFrom(
        this.http.post('/dispatch/send-email-and-calendar', {
          to: session.company.email,
          subject: 'Service Booking Confirmation',
          body: 'Mark‘s summary',
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
      startAt: new Date(twilioParams.Timestamp),
    };

    const callLog = await this.callLogService.create(callLogData);
    winstonLogger.log(
      `[CallDataPersistenceService][createCallLogRecord] Created CallLog for ${session.callSid}`,
    );
    return callLog;
  }

  private async createTranscriptAndChunks(
    session: CallSkeleton,
  ): Promise<void> {
    // Create transcript placeholder record
    const transcript = await this.transcriptService.create({
      callSid: session.callSid,
      summary: 'Transcript summary', // Will be generated by AI
      keyPoints: [],
    });

    // Convert conversation history to transcript chunks
    const chunks = DataTransformerHelper.convertMessagesToChunks(
      session.history,
    );
    if (chunks.length > 0) {
      await this.transcriptChunkService.createMany(transcript._id, chunks);
    }

    // Generate AI summary
    try {
      const aiSummary = await this.aiIntegration.generateAISummary(
        session.callSid,
        session,
      );

      // Validate and clean AI returned data
      const cleanedSummary =
        DataTransformerHelper.cleanAISummaryResponse(aiSummary);

      await this.transcriptService.update(transcript._id, cleanedSummary);
      winstonLogger.log(
        `[CallDataPersistenceService][createTranscriptAndChunks] Generated AI summary for ${session.callSid}`,
      );
    } catch (error) {
      winstonLogger.error(
        `[CallDataPersistenceService][createTranscriptAndChunks] Failed to generate AI summary for ${session.callSid}`,
        { error: (error as Error).message },
      );

      // Provide fallback summary
      try {
        const fallbackSummary = ValidationHelper.validateTranscriptData({
          summary: 'Call summary generation failed',
          keyPoints: ['Summary could not be generated'],
        });
        await this.transcriptService.update(transcript._id, fallbackSummary);
      } catch (fallbackError) {
        winstonLogger.error(
          `[CallDataPersistenceService][createTranscriptAndChunks] Failed to update transcript with fallback summary for ${session.callSid}`,
          { error: (fallbackError as Error).message },
        );
      }
    }
  }

  private async createServiceBookingRecord(
    session: CallSkeleton,
  ): Promise<ServiceBookingDocument> {
    if (
      session.user.service == null ||
      session.user.serviceBookedTime == null
    ) {
      winstonLogger.warn(
        `[CallDataPersistenceService][createServiceBookingRecord] Missing service or booking time for ${session.callSid}`,
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
        `[CallDataPersistenceService][createServiceBookingRecord] Service booking created successfully for ${session.callSid}, booking ID: ${String((serviceBooking as any)._id)}`,
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
        `[CallDataPersistenceService][updateCallLogWithBookingId] Updated CallLog ${callLogId} with ServiceBooking ID ${serviceBookingId}`,
      );
    } catch (error) {
      winstonLogger.error(
        `[CallDataPersistenceService][updateCallLogWithBookingId] Failed to update CallLog ${callLogId}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
      // Don't throw - this is not critical enough to fail the whole process
    }
  }
}
