import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { CalendarTokenService } from './calendar-token.service';
import { CreateCalendarTokenDto } from './dto/create-calendar-token.dto';
import { CalendarToken } from './schema/calendar-token.schema';

@ApiTags('calendar-token')
@Controller('calendar-token')
export class CalendarTokenController {
  constructor(private readonly calendarTokenService: CalendarTokenService) {}

  @ApiOperation({ summary: 'Get a valid access token' })
  @ApiResponse({ status: 200, description: 'Token fetched successfully' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @Get('user/:userId/valid')
  async getValidToken(
    @Param('userId') userId: string,
    @Query('provider') provider: string = 'google',
  ) {
    return await this.calendarTokenService.getValidToken(userId, provider);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @Post('user/:userId/refresh')
  async refreshToken(
    @Param('userId') userId: string,
    @Query('provider') provider: string = 'google',
  ) {
    return await this.calendarTokenService.refreshToken(userId, provider);
  }

  @ApiOperation({ summary: 'Create or update calendar token' })
  @ApiResponse({ status: 201, description: 'Token created/updated successfully' })
  @Post()
  async createOrUpdateToken(@Body() createDto: CreateCalendarTokenDto) {
    return await this.calendarTokenService.createOrUpdateToken(createDto);
  }

  @ApiOperation({ summary: 'Get user calendar token' })
  @ApiResponse({ status: 200, description: 'Token fetched successfully' })
  @Get('user/:userId')
  async getUserToken(
    @Param('userId') userId: string,
    @Query('provider') provider: string = 'google',
  ) {
    return await this.calendarTokenService.getUserToken(userId, provider);
  }

  @ApiOperation({ summary: 'Delete user calendar token' })
  @ApiResponse({ status: 200, description: 'Token deleted successfully' })
  @Delete('user/:userId')
  async deleteUserToken(
    @Param('userId') userId: string,
    @Query('provider') provider: string = 'google',
  ) {
    await this.calendarTokenService.deleteUserToken(userId, provider);
    return { message: 'Token deleted' };
  }

  @ApiOperation({ summary: 'Check if token is expiring soon' })
  @ApiResponse({ status: 200, description: 'Check result' })
  @Get('user/:userId/expiring')
  async isTokenExpiringSoon(
    @Param('userId') userId: string,
    @Query('provider') provider: string = 'google',
  ) {
    const isExpiring = await this.calendarTokenService.isTokenExpiringSoon(userId, provider);
    return { isExpiringSoon: isExpiring };
  }
}
