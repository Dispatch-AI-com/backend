import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CalendarOAuthService } from './services/calendar-oauth.service';
import { CalendarTokenService } from './calendar-token.service';

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
    @Query('state') state: string,
    @Res() res: Response,
  ): void {
    const url = this.oauthService.buildGoogleAuthUrl({ state: state ?? 'calendar', userId });
    res.redirect(url);
  }

  @ApiOperation({ summary: 'Google OAuth callback for Calendar' })
  @ApiResponse({ status: 302, description: 'Persists token and redirects to frontend' })
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

    // Persist token using existing storage logic
    const expiresAt = new Date(Date.now() + token.expiresIn * 1000).toISOString();
    await this.calendarTokenService.createOrUpdateToken({
      userId,
      provider: 'google',
      accessToken: token.accessToken,
      refreshToken: token.refreshToken ?? '',
      expiresAt,
      tokenType: token.tokenType ?? 'Bearer',
      scope: token.scope ?? 'https://www.googleapis.com/auth/calendar',
      calendarId: 'primary',
    });

    const frontendUrl = process.env.APP_URL ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/settings/calendar?connected=google`);
  }
}


