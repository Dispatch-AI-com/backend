/**
 * Data Transformer Helper
 *
 * Pure utility functions for transforming data between different formats.
 * Used for converting between internal data structures and external APIs.
 */

import type { Message } from '../types/redis-session';

export const DataTransformerHelper = {
  /**
   * Convert conversation messages to transcript chunks format
   */
  convertMessagesToChunks(messages: Message[]): {
    speakerType: 'AI' | 'User';
    text: string;
    startAt: number;
  }[] {
    return messages.map((msg, index) => ({
      speakerType: msg.speaker === 'AI' ? 'AI' : 'User',
      text: msg.message,
      startAt: new Date(msg.startedAt).getTime() + index, // Ensure uniqueness
    }));
  },

  /**
   * Convert session messages to AI conversation format
   */
  convertToAIConversationFormat(messages: Message[]): {
    speaker: 'AI' | 'customer';
    message: string;
    timestamp: string;
  }[] {
    return messages.map(msg => ({
      speaker: msg.speaker === 'AI' ? 'AI' : 'customer',
      message: msg.message,
      timestamp: msg.startedAt,
    }));
  },

  /**
   * Clean and validate AI summary response
   */
  cleanAISummaryResponse(aiSummary: unknown): {
    summary: string;
    keyPoints: string[];
  } {
    const summary =
      aiSummary && typeof aiSummary === 'object' && 'summary' in aiSummary
        ? aiSummary.summary
        : undefined;
    const keyPoints =
      aiSummary && typeof aiSummary === 'object' && 'keyPoints' in aiSummary
        ? aiSummary.keyPoints
        : undefined;

    return {
      summary:
        typeof summary === 'string' ? summary : 'Call summary not available',
      keyPoints: Array.isArray(keyPoints) ? keyPoints : [],
    };
  },

  /**
   * Extract service info for AI analysis
   */
  extractServiceInfoForAI(session: unknown): {
    name: string;
    booked: boolean;
    company: string;
  } {
    if (!session || typeof session !== 'object') {
      return {
        name: 'general inquiry',
        booked: false,
        company: 'Unknown',
      };
    }

    const sessionObj = session as any;
    return {
      name:
        sessionObj.user?.service?.name ??
        (sessionObj.services?.length > 0
          ? sessionObj.services[0].name
          : null) ??
        'general inquiry',
      booked: Boolean(sessionObj.servicebooked),
      company: sessionObj.company?.name ?? 'Unknown',
    };
  },

  /**
   * Build customer message for AI API
   */
  buildCustomerMessageForAI(message: string): {
    speaker: string;
    message: string;
    startedAt: string;
  } {
    return {
      speaker: 'customer',
      message,
      startedAt: new Date().toISOString(),
    };
  },
} as const;
