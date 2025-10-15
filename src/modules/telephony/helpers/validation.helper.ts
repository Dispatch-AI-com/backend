/**
 * Validation Helper
 *
 * Pure utility functions for validating call data and business logic.
 * Contains validation rules and business logic checks.
 */

import type { CallSkeleton } from '../types/redis-session';

export const ValidationHelper = {
  /**
   * Check if call status is final (completed or canceled)
   */
  isFinalCallStatus(status: string): boolean {
    const FINAL_CALL_STATUSES = ['completed', 'canceled'];
    return FINAL_CALL_STATUSES.includes(status);
  },

  /**
   * Validate if session has required data for service booking
   */
  canCreateServiceBooking(session: CallSkeleton): {
    isValid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];

    if (session.user.service == null) {
      missingFields.push('service');
    }

    if (session.user.serviceBookedTime == null) {
      missingFields.push('serviceBookedTime');
    }

    if (
      session.user.userInfo.name == null ||
      session.user.userInfo.name.trim() === ''
    ) {
      missingFields.push('customer name');
    }

    if (
      session.user.userInfo.phone == null ||
      session.user.userInfo.phone.trim() === ''
    ) {
      missingFields.push('customer phone');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  },

  /**
   * Check if session should be processed for completion
   */
  shouldProcessSession(session: CallSkeleton | null): boolean {
    return session !== null;
  },

  /**
   * Validate AI response data
   */
  isValidAIResponse(response: unknown): boolean {
    return (
      response != null &&
      typeof response === 'object' &&
      'message' in response &&
      typeof response.message === 'string' &&
      response.message.trim().length > 0
    );
  },

  /**
   * Check if service is available for booking
   */
  isServiceAvailable(session: CallSkeleton): boolean {
    return Boolean(session.servicebooked && session.user.service);
  },

  /**
   * Validate customer address format
   */
  isValidAddress(address: string | undefined): boolean {
    return Boolean(address?.trim());
  },

  /**
   * Extract fallback address if primary address is invalid
   */
  getFallbackAddress(address: string | undefined): string {
    return this.isValidAddress(address) && address != null
      ? address
      : 'Address not provided';
  },

  /**
   * Validate transcript data before saving
   */
  validateTranscriptData(data: { summary?: string; keyPoints?: string[] }): {
    summary: string;
    keyPoints: string[];
  } {
    return {
      summary:
        typeof data.summary === 'string'
          ? data.summary
          : 'Call summary not available',
      keyPoints: Array.isArray(data.keyPoints)
        ? data.keyPoints
        : ['Summary could not be generated'],
    };
  },
} as const;
