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
    @Query('error') error: string,
    @Query('userId') userIdFromQuery: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const defaultFrom = '/admin/settings?connected=google';

    if (error) {
      res.redirect(`${frontendUrl}${defaultFrom}&error=cancelled`);
      return;
    }

    let token;
    try {
      token = await this.oauthService.exchangeGoogleCodeForToken(code);
    } catch (e) {
      console.error('Failed to exchange token', e);
      res.redirect(`${frontendUrl}${defaultFrom}&error=oauth_failed`);
      return;
    }

    // Parse userId from state first (if present), otherwise fallback to query
    let parsedUserId: string | undefined;
    let fromPath: string | undefined;
    try {
      if (state) {
        const obj = JSON.parse(state);
        parsedUserId = obj.u as string;
        fromPath = obj.from as string | undefined;
      }
    } catch {
      // ignore parse errors
    }
    const userId = parsedUserId ?? userIdFromQuery;

    // get user info (using UserInfo API, no extra configuration)
    let userInfo: {
      id?: string;
      email?: string;
      name?: string;
      picture?: string;
    } | null = null;
    try {
      userInfo = await this.oauthService.getUserInfo(token.accessToken);
    } catch (err) {
      console.warn('Failed to fetch user info', err);
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

    const safeFrom = fromPath?.startsWith('/') ? fromPath : defaultFrom;

    const redirectUrl = new URL(safeFrom, frontendUrl);
    if (userInfo?.email && !redirectUrl.searchParams.has('gEmail')) {
      redirectUrl.searchParams.set('gEmail', userInfo.email);
    }
    if (!redirectUrl.searchParams.has('connected')) {
      redirectUrl.searchParams.set('connected', 'google');
    }
    redirectUrl.searchParams.set('success', '1');
    res.redirect(redirectUrl.toString());
  }
}
