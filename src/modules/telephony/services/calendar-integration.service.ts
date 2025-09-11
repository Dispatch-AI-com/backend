import { Injectable } from '@nestjs/common';

import { CalendarTokenService } from '@/modules/calendar';

@Injectable()
export class CalendarIntegrationService {
  constructor(private readonly calendarTokenService: CalendarTokenService) {}

  /**
   * 通过用户ID获取Google Calendar访问令牌
   * 如果令牌即将过期，会自动标记需要刷新
   */
  async getGoogleCalendarTokenByUser(userId: string): Promise<{
    accessToken: string;
    needsRefresh: boolean;
    expiresAt: Date;
  }> {
    try {
      return await this.calendarTokenService.getValidToken(userId, 'google');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `获取用户 ${userId} 的Google Calendar令牌失败: ${errorMessage}`,
      );
    }
  }

  /**
   * 在创建日历事件前检查并刷新令牌
   * 返回有效的访问令牌供AI后端使用
   */
  async ensureValidTokenForCalendarEvent(userId: string): Promise<string> {
    const tokenInfo = await this.getGoogleCalendarTokenByUser(userId);
    if (tokenInfo.needsRefresh) {
      const refreshedToken = await this.calendarTokenService.refreshToken(
        userId,
        'google',
      );
      return refreshedToken.accessToken;
    }
    return tokenInfo.accessToken;
  }

  /**
   * 检查用户是否有有效的日历令牌
   */
  async hasValidCalendarToken(
    userId: string,
    provider = 'google',
  ): Promise<boolean> {
    try {
      const token = await this.calendarTokenService.getUserToken(
        userId,
        provider,
      );
      if (!token) return false;

      const isExpiringSoon =
        await this.calendarTokenService.isTokenExpiringSoon(userId, provider);
      return !isExpiringSoon;
    } catch {
      return false;
    }
  }

  /**
   * 为AI后端准备日历API调用参数（基于 userId）
   */
  async prepareCalendarApiParams(userId: string): Promise<{
    accessToken: string;
    calendarId?: string;
    provider: string;
  }> {
    const token = await this.calendarTokenService.getUserToken(
      userId,
      'google',
    );
    if (!token) {
      throw new Error(`用户 ${userId} 没有Google Calendar令牌`);
    }

    const isExpiringSoon = await this.calendarTokenService.isTokenExpiringSoon(
      userId,
      'google',
    );
    let accessToken = token.accessToken;
    if (isExpiringSoon) {
      const refreshed = await this.calendarTokenService.refreshToken(
        userId,
        'google',
      );
      accessToken = refreshed.accessToken;
    }

    return {
      accessToken,
      calendarId: token.calendarId,
      provider: token.provider,
    };
  }
}
