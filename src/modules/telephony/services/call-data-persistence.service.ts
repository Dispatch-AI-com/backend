import { Injectable } from '@nestjs/common';

import { ICallLog } from '@/common/interfaces/calllog';
import { VoiceStatusBody } from '@/common/interfaces/twilio-voice-webhook';
import { winstonLogger } from '@/logger/winston.logger';
import { CalllogService } from '@/modules/calllog/calllog.service';
import { CreateCallLogDto } from '@/modules/calllog/dto/create-calllog.dto';
import { TranscriptService } from '@/modules/transcript/transcript.service';
import { CreateTranscriptChunkDto } from '@/modules/transcript-chunk/dto/create-transcript-chunk.dto';
import { TranscriptChunkService } from '@/modules/transcript-chunk/transcript-chunk.service';

import { DataTransformerHelper } from '../helpers/data-transformer.helper';
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
      const aiSummary = await this.generateAISummaryForSession(
        session.callSid,
        session,
      );

      // Step 2: Create call log record (only if not already created by AI service)
      if (!session.intentClassified) {
        // CallLog not yet created - create it now
        await this.createCallLogRecord(
          session.callSid,
          session.company.userId,
          undefined, // No service booking
          twilioParams.Caller,
          session.user.userInfo.name ?? 'Unknown Caller',
          new Date(twilioParams.Timestamp),
          session.intent, // Pass intent from session
        );
      } else {
        winstonLogger.log(
          `[CallDataPersistenceService][processCallCompletion] CallLog already created by AI service for ${callSid}`,
        );
      }

      // Step 3: Create transcript and chunks
      await this.createTranscriptAndChunks(
        session.callSid,
        aiSummary.summary,
        aiSummary.keyPoints,
        session.history,
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
    intent?: string,
  ): Promise<ICallLog> {
    const callLogDto: CreateCallLogDto = {
      callSid,
      userId,
      serviceBookedId,
      callerNumber,
      callerName,
      startAt,
      intent,
    };

    const callLog = await this.callLogService.create(callLogDto);
    const intentLabel = intent ?? 'unknown';
    winstonLogger.log(
      `[CallDataPersistenceService][createCallLogRecord] Created CallLog for ${callSid} with intent: ${intentLabel}`,
    );
    return callLog;
  }

  private async createTranscriptAndChunks(
    callSid: string,
    summary: string,
    keyPoints: string[],
    history: Message[],
  ): Promise<void> {
    // Create transcript record with AI-generated summary
    const transcript = await this.transcriptService.create({
      callSid,
      summary,
      keyPoints,
    });

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
}
