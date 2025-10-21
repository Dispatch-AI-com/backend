import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CalendarTokenService } from './calendar-token.service';
import { CalendarOAuthService } from './services/calendar-oauth.service';

@ApiTags('calendar-oauth')
@Controller('calendar/oauth')
export class CalendarOAuthController {
  constructor(
    private readonly oauthService: CalendarOAuthService,
    private readonly calendarTokenService: CalendarTokenService,
  ) {}

  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  @Get('google')
  redirectToGoogle(
    @Query('userId') userId: string,
    @Res() res: Response,
    @Query('state') state?: string,
  ): void {
    const url = this.oauthService.buildGoogleAuthUrl({
      state: state ?? 'calendar',
      userId,
    });
    res.redirect(url);
  }

  @ApiOperation({ summary: 'Google OAuth callback for Calendar' })
  @ApiResponse({
    status: 302,
    description: 'Persists token and redirects to frontend',
  })
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('userId') userIdFromQuery: string,
    @Res() res: Response,
  ): Promise<void> {
    const token = await this.oauthService.exchangeGoogleCodeForToken(code);

    // Parse userId from state first (if present), otherwise fallback to query
    let parsedUserId: string | undefined;
    try {
      if (state) {
        const obj = JSON.parse(state);
        parsedUserId = obj.u as string;
      }
    } catch {
      // ignore parse errors
    }
    const userId = parsedUserId ?? userIdFromQuery;

    // 获取用户信息 (使用UserInfo API，无需额外配置)
    let userInfo = null;
    try {
      userInfo = await this.oauthService.getUserInfo(token.accessToken);
      console.log('用户信息:', userInfo);
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }

    // Persist token using existing storage logic
    const expiresAt = new Date(
      Date.now() + token.expiresIn * 1000,
    ).toISOString();
    await this.calendarTokenService.createOrUpdateToken({
      userId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken ?? '',
      expiresAt,
      tokenType: token.tokenType ?? 'Bearer',
      scope: token.scope ?? 'https://www.googleapis.com/auth/calendar',
      calendarId: 'primary',
      // store user info
      googleUserId: userInfo?.id,
      userEmail: userInfo?.email,
      userName: userInfo?.name,
      userPicture: userInfo?.picture,
    });

    const frontendUrl = process.env.APP_URL ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/settings/calendar?connected=google`);
  }
}
