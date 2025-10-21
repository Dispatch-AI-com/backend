import { Injectable, Logger } from '@nestjs/common';

import { CalendarTokenService } from '../calendar-token.service';

/**
 * MCP Calendar integration service
 * Provides calendar and email integration for AI backend using MCP.
 */
@Injectable()
export class McpCalendarIntegrationService {
  private readonly logger = new Logger(McpCalendarIntegrationService.name);

  constructor(private readonly calendarTokenService: CalendarTokenService) {}

  /**
   * Prepare calendar event parameters for MCP AI backend,
   * combined with email sending details.
   */
  async prepareMcpCalendarEvent(
    userId: string,
    eventData: {
      // Email
      to: string;
      subject: string;
      body: string;

      // Calendar event
      summary: string;
      start: string;
      end: string;
      description?: string;
      location?: string;
      attendees?: string[];
      alarm_minutes_before?: number;
      timezone?: string;
    },
  ): Promise<{
    // MCP API params
    accessToken: string;
    calendarId?: string;
    provider: string;
    eventData: typeof eventData;
  }> {
    try {
      // 1) Get valid access token (auto refresh if near expiry)
      const tokenInfo = await this.calendarTokenService.getValidToken(userId);

      // 2) Refresh if token needs refresh
      let accessToken = tokenInfo.accessToken;
      if (tokenInfo.needsRefresh) {
        this.logger.log(
          `User ${userId} Google Calendar token expiring soon, refreshing...`,
        );
        const refreshedToken =
          await this.calendarTokenService.refreshToken(userId);
        accessToken = refreshedToken.accessToken;
        this.logger.log(
          `Token refreshed. New expiry: ${refreshedToken.expiresAt.toISOString()}`,
        );
      }

      // 3) Get user calendar configuration
      const userToken = await this.calendarTokenService.getUserToken(userId);

      return {
        accessToken,
        calendarId: userToken?.calendarId ?? 'primary',
        provider: 'google',
        eventData: {
          ...eventData,
          timezone: eventData.timezone ?? 'Australia/Sydney', // default timezone
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to prepare MCP calendar event for user ${userId}:`,
        error,
      );
      throw new Error(`Failed to prepare calendar event: ${errorMessage}`);
    }
  }

  /**
   * Check whether user can create calendar events.
   */
  async canUserCreateCalendarEvent(userId: string): Promise<boolean> {
    try {
      const token = await this.calendarTokenService.getUserToken(userId);
      if (!token) return false;

      // Check whether token is expiring soon
      const isExpiringSoon =
        await this.calendarTokenService.isTokenExpiringSoon(userId);
      return !isExpiringSoon;
    } catch {
      return false;
    }
  }

  /**
   * Get user's calendar configuration.
   */
  async getUserCalendarConfig(userId: string): Promise<{
    hasValidToken: boolean;
    provider: string;
    calendarId?: string;
    tokenExpiresAt?: Date;
    canCreateEvents: boolean;
  }> {
    try {
      const token = await this.calendarTokenService.getUserToken(userId);

      if (!token) {
        return {
          hasValidToken: false,
          provider: 'google',
          calendarId: undefined,
          tokenExpiresAt: undefined,
          canCreateEvents: false,
        };
      }

      const isExpiringSoon =
        await this.calendarTokenService.isTokenExpiringSoon(userId);

      return {
        hasValidToken: true,
        provider: token.provider,
        calendarId: token.calendarId,
        tokenExpiresAt: token.expiresAt,
        canCreateEvents: !isExpiringSoon,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get calendar config for user ${userId}:`,
        error,
      );
      return {
        hasValidToken: false,
        provider: 'google',
        calendarId: undefined,
        tokenExpiresAt: undefined,
        canCreateEvents: false,
      };
    }
  }

  /**
   * Prepare MCP call params for Telephony when creating calendar events during calls.
   */
  async prepareTelephonyMcpCall(
    userId: string,
    callData: {
      customerName: string;
      customerPhone: string;
      serviceType: string;
      preferredTime: string;
      customerEmail?: string;
    },
  ): Promise<{
    // Email content
    emailData: {
      to: string;
      subject: string;
      body: string;
    };
    // Calendar event content
    calendarData: {
      summary: string;
      start: string;
      end: string;
      description: string;
      location?: string;
      attendees?: string[];
    };
    // MCP API params
    mcpParams: {
      accessToken: string;
      calendarId?: string;
      provider: string;
      calendarapp: 'google';
    };
  }> {
    try {
      // 1) Get valid access token
      const tokenInfo = await this.calendarTokenService.getValidToken(userId);

      let accessToken = tokenInfo.accessToken;
      if (tokenInfo.needsRefresh) {
        const refreshedToken =
          await this.calendarTokenService.refreshToken(userId);
        accessToken = refreshedToken.accessToken;
      }

      // 2) Get user calendar config
      const userToken = await this.calendarTokenService.getUserToken(userId);

      // 3) Build email content
      const emailData = {
        to: callData.customerEmail ?? 'customer@example.com',
        subject: `Appointment Confirmation - ${callData.serviceType}`,
        body: `
Dear ${callData.customerName},

Thank you for choosing our service!

Appointment details:
- Service: ${callData.serviceType}
- Time: ${callData.preferredTime}
- Phone: ${callData.customerPhone}

If you have any questions, please feel free to contact us.

Best regards,
        `.trim(),
      };

      // 4) Build calendar event content
      const calendarData = {
        summary: `Customer Appointment - ${callData.serviceType}`,
        start: callData.preferredTime,
        end: this.calculateEndTime(
          callData.preferredTime,
          callData.serviceType,
        ),
        description: `
Customer: ${callData.customerName}
Phone: ${callData.customerPhone}
Service: ${callData.serviceType}
        `.trim(),
        location: 'TBD',
        attendees: callData.customerEmail !== undefined ? [callData.customerEmail] : [],
      };

      // 5) Build MCP API params
      const mcpParams = {
        accessToken,
        calendarId: userToken?.calendarId ?? 'primary',
        provider: 'google',
        calendarapp: 'google' as const,
      };

      return {
        emailData,
        calendarData,
        mcpParams,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to prepare Telephony MCP call for user ${userId}:`,
        error,
      );
      throw new Error(`Failed to prepare MCP call: ${errorMessage}`);
    }
  }

  /**
   * Call MCP AI backend to create calendar event and send email.
   */
  callMcpAiBackend(
    userId: string,
    mcpParams: Record<string, unknown>,
    emailData: Record<string, unknown>,
    calendarData: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    eventId: string;
    emailSent: boolean;
    message: string;
    timestamp: string;
  }> {
    try {
      // Build MCP API request payload
      const mcpRequest: Record<string, unknown> = {
        ...mcpParams,
        ...emailData,
        ...calendarData,
        timezone: 'Australia/Sydney',
        alarm_minutes_before: 15, // 15-minute reminder before event
      };

      const accessToken = mcpRequest.accessToken as string | undefined;
      const calendarId = mcpRequest.calendarId as string | undefined;
      const summary = mcpRequest.summary as string | undefined;
      const to = mcpRequest.to as string | undefined;

      this.logger.log(`Calling MCP AI backend, user: ${userId}`, {
        hasAccessToken: accessToken !== undefined,
        calendarId,
        eventSummary: summary,
        emailTo: to,
      });

      // TODO: Call AI backend MCP API here.
      // Temporarily return mock data for now.
      const result = {
        success: true,
        eventId: `event_${String(Date.now())}`,
        emailSent: true,
        message: 'Calendar event created and email sent',
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`MCP AI backend call succeeded:`, result);
      return Promise.resolve(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to call MCP AI backend:`, error);
      throw new Error(`Failed to call MCP AI backend: ${errorMessage}`);
    }
  }

  /**
   * Calculate service end time based on service type.
   */
  private calculateEndTime(startTime: string, serviceType: string): string {
    const start = new Date(startTime);
    let durationMinutes = 60; // default 1 hour

    // Set different durations by service type
    switch (serviceType.toLowerCase()) {
      case 'cleaning':
        durationMinutes = 120; // 2 hours
        break;
      case 'repair':
        durationMinutes = 90; // 1.5 hours
        break;
      case 'consultation':
        durationMinutes = 30; // 30 minutes
        break;
      default:
        durationMinutes = 60; // 1 hour
    }

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return end.toISOString();
  }
}
