import { Injectable } from '@nestjs/common';

import { CalendarIntegrationService } from './calendar-integration.service';

@Injectable()
export class AiCalendarBridgeService {
  constructor(
    private readonly calendarIntegration: CalendarIntegrationService,
  ) {}

  /**
   * 为AI后端准备日历事件创建参数
   * 这个方法会在telephony系统中被调用，当需要创建日历事件时
   */
  async prepareCalendarEventForAi(
    companyId: string,
    eventData: {
      summary: string;
      start: string;
      end: string;
      description?: string;
      location?: string;
      attendees?: string[];
    },
  ): Promise<{
    // 这些参数会传递给AI后端的MCP API
    accessToken: string;
    calendarId?: string;
    provider: string;
    eventData: typeof eventData;
  }> {
    // 获取有效的访问令牌（如果过期会自动刷新）
    const calendarParams =
      await this.calendarIntegration.prepareCalendarApiParams(companyId);

    return {
      ...calendarParams,
      eventData,
    };
  }

  /**
   * 检查公司是否可以创建日历事件
   */
  async canCreateCalendarEvent(companyId: string): Promise<boolean> {
    return await this.calendarIntegration.hasValidCalendarToken(
      companyId,
      'google',
    );
  }

  /**
   * 获取公司的日历配置信息
   */
  async getCompanyCalendarConfig(companyId: string): Promise<{
    hasValidToken: boolean;
    provider: string;
    calendarId?: string;
    tokenExpiresAt?: Date;
  }> {
    try {
      // 获取令牌过期时间等信息
      const token =
        await this.calendarIntegration.getGoogleCalendarTokenByUser(companyId);
      // 获取 calendarId 等配置
      const params =
        await this.calendarIntegration.prepareCalendarApiParams(companyId);
      return {
        hasValidToken: true,
        provider: params.provider,
        calendarId: params.calendarId,
        tokenExpiresAt: token.expiresAt,
      };
    } catch {
      return {
        hasValidToken: false,
        provider: 'google',
        calendarId: undefined,
        tokenExpiresAt: undefined,
      };
    }
  }
}
