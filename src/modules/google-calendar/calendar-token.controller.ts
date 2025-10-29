import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Header } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { generateCSRFToken, validateCSRFToken } from '@/utils/csrf.util';

import { CalendarTokenService } from './calendar-token.service';
import { CreateCalendarTokenDto } from './dto/create-calendar-token.dto';
import { CalendarOAuthService } from './services/calendar-oauth.service';

@ApiTags('calendar-token')
@Controller('calendar-token')
export class CalendarTokenController {
  constructor(
    private readonly calendarTokenService: CalendarTokenService,
    private readonly oauthService: CalendarOAuthService,
  ) {}

  @ApiOperation({ summary: 'Get a valid access token' })
  @ApiResponse({ status: 200, description: 'Token fetched successfully' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @Get('user/:userId/valid')
  @Header('Cache-Control', 'no-store')
  async getValidToken(@Param('userId') userId: string) {
    return await this.calendarTokenService.getValidToken(userId);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @Post('user/:userId/refresh')
  async refreshToken(@Param('userId') userId: string) {
    return await this.calendarTokenService.refreshToken(userId);
  }

  @ApiOperation({ summary: 'Create or update calendar token' })
  @ApiResponse({
    status: 201,
    description: 'Token created/updated successfully',
  })
  @Post()
  async createOrUpdateToken(@Body() createDto: CreateCalendarTokenDto) {
    return await this.calendarTokenService.createOrUpdateToken(createDto);
  }

  @ApiOperation({ summary: 'Get user calendar token' })
  @ApiResponse({ status: 200, description: 'Token fetched successfully' })
  @Get('user/:userId')
  async getUserToken(@Param('userId') userId: string) {
    return await this.calendarTokenService.getUserToken(userId);
  }

  @ApiOperation({ summary: 'Delete user calendar token' })
  @ApiResponse({ status: 200, description: 'Token deleted successfully' })
  @ApiHeader({
    name: 'X-CSRF-Token',
    required: true,
    description: 'CSRF token',
  })
  @Delete('user/:userId')
  async deleteUserToken(
    @Param('userId') userId: string,
    @Headers('X-CSRF-Token') csrfToken?: string,
  ) {
    if (!csrfToken || !validateCSRFToken(csrfToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    await this.calendarTokenService.deleteUserToken(userId);
    return { message: 'Token deleted' };
  }

  @ApiOperation({ summary: 'Check if token is expiring soon' })
  @ApiResponse({ status: 200, description: 'Check result' })
  @Get('user/:userId/expiring')
  async isTokenExpiringSoon(@Param('userId') userId: string) {
    const isExpiring =
      await this.calendarTokenService.isTokenExpiringSoon(userId);
    return { isExpiringSoon: isExpiring };
  }

  @ApiOperation({ summary: 'Get user profile information from Google' })
  @ApiResponse({
    status: 200,
    description: 'User profile information retrieved',
  })
  @Get('user/:userId/profile')
  async getUserProfile(@Param('userId') userId: string): Promise<{
    googleUserId?: string;
    userEmail?: string;
    userName?: string;
    userPicture?: string;
  }> {
    const token = await this.calendarTokenService.getUserToken(userId);
    if (!token) {
      throw new NotFoundException(`No calendar token found for user ${userId}`);
    }

    // Always try to fetch latest profile; if fails, try refresh then retry once
    const toResponse = (p: {
      id?: string;
      email?: string;
      name?: string;
      picture?: string;
    }) => ({
      googleUserId: p.id ?? token.googleUserId ?? undefined,
      userEmail: p.email ?? token.userEmail ?? undefined,
      userName: p.name ?? token.userName ?? undefined,
      userPicture: p.picture ?? token.userPicture ?? undefined,
    });

    try {
      const info = await this.oauthService.getUserInfo(token.accessToken);
      await this.calendarTokenService.updateUserInfo(userId, {
        googleUserId: info.id,
        userEmail: info.email,
        userName: info.name,
        userPicture: info.picture,
      });
      return toResponse(info);
    } catch {
      // attempt refresh then retry once
      try {
        const refreshed = await this.calendarTokenService.refreshToken(userId);
        const info2 = await this.oauthService.getUserInfo(
          refreshed.accessToken,
        );
        await this.calendarTokenService.updateUserInfo(userId, {
          googleUserId: info2.id,
          userEmail: info2.email,
          userName: info2.name,
          userPicture: info2.picture,
        });
        return toResponse(info2);
      } catch {
        // return whatever we have, with explicit nulls so frontend won't see {}
        return toResponse({});
      }
    }
  }

  @ApiOperation({ summary: 'Get CSRF token for write operations' })
  @ApiResponse({
    status: 200,
    description: 'CSRF token generated and cookie set',
  })
  @Get('csrf-token')
  getCsrfToken(@Res() res: Response): void {
    const csrfToken = generateCSRFToken();
    res.cookie('csrfToken', csrfToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000,
    });
    res.json({ csrfToken });
  }

  @ApiOperation({ summary: 'Test access token permissions' })
  @ApiResponse({ status: 200, description: 'Token permissions checked' })
  @Get('user/:userId/test-token')
  async testTokenPermissions(@Param('userId') userId: string) {
    const token = await this.calendarTokenService.getUserToken(userId);
    if (!token) {
      throw new NotFoundException(`No calendar token found for user ${userId}`);
    }

    const results = {
      hasCalendarScope: token.scope.includes('calendar'),
      hasUserInfoEmailScope: token.scope.includes('userinfo.email'),
      hasUserInfoProfileScope: token.scope.includes('userinfo.profile'),
      currentScope: token.scope,
      userInfoTest: null as any,
    };

    // Test if we can call userinfo API
    try {
      const userInfo = await this.oauthService.getUserInfo(token.accessToken);
      results.userInfoTest = { success: true, data: userInfo };
    } catch (error) {
      results.userInfoTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    return results;
  }
}
