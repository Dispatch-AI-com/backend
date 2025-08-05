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
      aiSummary != null &&
      typeof aiSummary === 'object' &&
      'summary' in aiSummary
        ? (aiSummary.summary as string)
        : undefined;
    const keyPoints =
      aiSummary != null &&
      typeof aiSummary === 'object' &&
      'keyPoints' in aiSummary
        ? (aiSummary.keyPoints as string[])
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
    if (session == null || typeof session !== 'object') {
      return {
        name: 'general inquiry',
        booked: false,
        company: 'Unknown',
      };
    }

    const sessionObj = session as Record<string, unknown>;

    // Safely extract user service name
    const user = sessionObj.user as Record<string, unknown> | undefined;
    const userService = user?.service as Record<string, unknown> | undefined;
    const userServiceName =
      typeof userService?.name === 'string' ? userService.name : undefined;

    // Safely extract services array name
    const services = sessionObj.services as unknown[] | undefined;
    const servicesName =
      Array.isArray(services) && services.length > 0
        ? (services[0] as Record<string, unknown>).name
        : undefined;
    const firstServiceName =
      typeof servicesName === 'string' ? servicesName : undefined;

    // Safely extract company name
    const company = sessionObj.company as Record<string, unknown> | undefined;
    const companyName =
      typeof company?.name === 'string' ? company.name : 'Unknown';

    return {
      name: userServiceName ?? firstServiceName ?? 'general inquiry',
      booked: Boolean(sessionObj.servicebooked),
      company: companyName,
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
