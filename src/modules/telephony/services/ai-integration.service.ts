import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom, retry, timeout } from 'rxjs';

import { winstonLogger } from '@/logger/winston.logger';

import { DataTransformerHelper } from '../helpers/data-transformer.helper';
import { CallSkeleton } from '../types/redis-session';

const AI_TIMEOUT_MS = 5_000;
const AI_RETRY = 2;

@Injectable()
export class AiIntegrationService {
  constructor(private readonly http: HttpService) {}

  async getAIReply(
    callSid: string,
    message: string,
  ): Promise<{ message: string; shouldHangup?: boolean }> {
    const { data } = await firstValueFrom(
      this.http
        .post<{ aiResponse: { message: string }; shouldHangup?: boolean }>(
          '/ai/conversation',
          {
            callSid,
            customerMessage:
              DataTransformerHelper.buildCustomerMessageForAI(message),
          },
        )
        .pipe(timeout(AI_TIMEOUT_MS), retry(AI_RETRY)),
    );
    return {
      message: data.aiResponse.message,
      shouldHangup: data.shouldHangup,
    };
  }

  async generateAISummary(
    callSid: string,
    session: CallSkeleton,
  ): Promise<{
    summary: string;
    keyPoints: string[];
  }> {
    try {
      // Prepare conversation data for AI analysis
      const conversation = DataTransformerHelper.convertToAIConversationFormat(
        session.history,
      );

      // Prepare service information
      const serviceInfo =
        DataTransformerHelper.extractServiceInfoForAI(session);

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

      winstonLogger.log(
        `[AiIntegrationService][generateAISummary] Generated AI summary for ${callSid}`,
      );

      return data;
    } catch (error) {
      winstonLogger.error(
        `[AiIntegrationService][generateAISummary] Failed to generate AI summary for ${callSid}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
      throw error;
    }
  }
}
