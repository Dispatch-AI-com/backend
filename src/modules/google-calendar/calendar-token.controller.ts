import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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
  @Delete('user/:userId')
  async deleteUserToken(@Param('userId') userId: string) {
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

    return {
      googleUserId: token.googleUserId,
      userEmail: token.userEmail,
      userName: token.userName,
      userPicture: token.userPicture,
    };
  }
}
