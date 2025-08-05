import { Injectable } from '@nestjs/common';

import { winstonLogger } from '@/logger/winston.logger';

import { DataTransformerHelper } from '../helpers/data-transformer.helper';
import { ValidationHelper } from '../helpers/validation.helper';
import { CallSkeleton } from '../types/redis-session';
import { AiIntegrationService } from './ai-integration.service';

@Injectable()
export class AiSummaryService {
  constructor(private readonly aiIntegration: AiIntegrationService) {}

  /**
   * Generate AI summary for a call session
   * @param callSid - The call session ID
   * @param session - The call session data
   * @param options - Generation options including fallback settings
   * @returns Promise with summary and key points
   */
  async generateSummary(
    callSid: string,
    session: CallSkeleton,
    options: {
      enableFallback?: boolean;
      fallbackSummary?: string;
      fallbackKeyPoints?: string[];
    } = {},
  ): Promise<{ summary: string; keyPoints: string[] }> {
    try {
      // Generate AI summary using the AI integration service
      const aiSummary = await this.aiIntegration.generateAISummary(
        callSid,
        session,
      );

      // Validate and clean AI returned data
      const cleanedSummary =
        DataTransformerHelper.cleanAISummaryResponse(aiSummary);

      winstonLogger.log(
        `[AiSummaryService][generateSummary] Generated AI summary for ${callSid}`,
      );

      return cleanedSummary;
    } catch (error) {
      winstonLogger.error(
        `[AiSummaryService][generateSummary] Failed to generate AI summary for ${callSid}`,
        { error: (error as Error).message },
      );

      // Handle fallback if enabled
      if (options.enableFallback !== false) {
        return this.generateFallbackSummary(callSid, options);
      }

      throw error;
    }
  }

  /**
   * Generate AI summary from raw conversation data
   * @param request - The AI summary request data
   * @param options - Generation options
   * @returns Promise with generated summary
   */
  async generateSummaryFromRequest(
    request: {
      callSid: string;
      conversation: unknown[];
      serviceInfo?: unknown;
    },
    options: {
      enableFallback?: boolean;
      fallbackSummary?: string;
      fallbackKeyPoints?: string[];
    } = {},
  ): Promise<{ summary: string; keyPoints: string[] }> {
    try {
      const aiSummary = await this.aiIntegration.generateAISummary(
        request.callSid,
        {
          callSid: request.callSid,
          history: request.conversation,
        } as CallSkeleton,
      );

      const cleanedSummary =
        DataTransformerHelper.cleanAISummaryResponse(aiSummary);

      winstonLogger.log(
        `[AiSummaryService][generateSummaryFromRequest] Generated AI summary for ${request.callSid}`,
      );

      return cleanedSummary;
    } catch (error) {
      winstonLogger.error(
        `[AiSummaryService][generateSummaryFromRequest] Failed to generate AI summary for ${request.callSid}`,
        { error: (error as Error).message },
      );

      if (options.enableFallback !== false) {
        return this.generateFallbackSummary(request.callSid, options);
      }

      throw error;
    }
  }

  /**
   * Batch generate summaries for multiple calls
   * @param requests - Array of summary requests
   * @param options - Generation options
   * @returns Promise with array of generated summaries
   */
  async generateBatchSummaries(
    requests: {
      callSid: string;
      conversation: unknown[];
      serviceInfo?: unknown;
    }[],
    options: {
      enableFallback?: boolean;
      fallbackSummary?: string;
      fallbackKeyPoints?: string[];
    } = {},
  ): Promise<{ summary: string; keyPoints: string[] }[]> {
    const summaries: { summary: string; keyPoints: string[] }[] = [];

    for (const request of requests) {
      try {
        const summary = await this.generateSummaryFromRequest(request, options);
        summaries.push(summary);
      } catch (error) {
        winstonLogger.error(
          `[AiSummaryService][generateBatchSummaries] Failed to generate summary for ${request.callSid}`,
          { error: (error as Error).message },
        );

        if (options.enableFallback !== false) {
          summaries.push(
            this.generateFallbackSummary(request.callSid, options),
          );
        } else {
          throw error;
        }
      }
    }

    return summaries;
  }

  /**
   * Generate a fallback summary when AI generation fails
   * @param callSid - The call session ID
   * @param options - Fallback options
   * @returns The fallback summary
   */
  private generateFallbackSummary(
    callSid: string,
    options: {
      enableFallback?: boolean;
      fallbackSummary?: string;
      fallbackKeyPoints?: string[];
    },
  ): { summary: string; keyPoints: string[] } {
    try {
      const fallbackSummary = ValidationHelper.validateTranscriptData({
        summary: options.fallbackSummary ?? 'Call summary generation failed',
        keyPoints: options.fallbackKeyPoints ?? [
          'Summary could not be generated',
        ],
      });

      winstonLogger.warn(
        `[AiSummaryService][generateFallbackSummary] Used fallback summary for ${callSid}`,
      );

      return fallbackSummary;
    } catch (fallbackError) {
      winstonLogger.error(
        `[AiSummaryService][generateFallbackSummary] Failed to generate fallback summary for ${callSid}`,
        { error: (fallbackError as Error).message },
      );

      // Return minimal fallback
      return {
        summary: 'Summary unavailable',
        keyPoints: ['Summary generation failed'],
      };
    }
  }
}
