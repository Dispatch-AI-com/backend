import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CalendarTokenService } from './calendar-token.service';
import { CreateCalendarTokenDto } from './dto/create-calendar-token.dto';

@ApiTags('calendar-token')
@Controller('calendar-token')
export class CalendarTokenController {
  constructor(private readonly calendarTokenService: CalendarTokenService) {}

  @ApiOperation({ summary: 'Get a valid access token' })
  @ApiResponse({ status: 200, description: 'Token fetched successfully' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @Get('user/:userId/valid')
  async getValidToken(@Param('userId') userId: string): Promise<{
    accessToken: string;
    needsRefresh: boolean;
    expiresAt: Date;
  }> {
    return await this.calendarTokenService.getValidToken(userId);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @Post('user/:userId/refresh')
  async refreshToken(@Param('userId') userId: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    return await this.calendarTokenService.refreshToken(userId);
  }

  @ApiOperation({ summary: 'Create or update calendar token' })
  @ApiResponse({
    status: 201,
    description: 'Token created/updated successfully',
  })
  @Post()
  async createOrUpdateToken(@Body() createDto: CreateCalendarTokenDto): Promise<import('./schema/calendar-token.schema').CalendarToken> {
    return await this.calendarTokenService.createOrUpdateToken(createDto);
  }

  @ApiOperation({ summary: 'Get user calendar token' })
  @ApiResponse({ status: 200, description: 'Token fetched successfully' })
  @Get('user/:userId')
  async getUserToken(@Param('userId') userId: string): Promise<import('./schema/calendar-token.schema').CalendarToken | null> {
    return await this.calendarTokenService.getUserToken(userId);
  }

  @ApiOperation({ summary: 'Delete user calendar token' })
  @ApiResponse({ status: 200, description: 'Token deleted successfully' })
  @Delete('user/:userId')
  async deleteUserToken(@Param('userId') userId: string): Promise<{ message: string }> {
    await this.calendarTokenService.deleteUserToken(userId);
    return { message: 'Token deleted' };
  }

  @ApiOperation({ summary: 'Check if token is expiring soon' })
  @ApiResponse({ status: 200, description: 'Check result' })
  @Get('user/:userId/expiring')
  async isTokenExpiringSoon(@Param('userId') userId: string): Promise<{ isExpiringSoon: boolean }> {
    const isExpiring =
      await this.calendarTokenService.isTokenExpiringSoon(userId);
    return { isExpiringSoon: isExpiring };
  }
}
