import { Controller, Post, Body, Req, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PushCalendarDto } from './dto/push-calendar.dto';
import { ApiTags, ApiOkResponse, ApiBadRequestResponse } from '@nestjs/swagger';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  @UseGuards(AuthGuard('jwt'))
  @Post('push')
  @ApiOkResponse({ description: 'push calendar event success' })
  @ApiBadRequestResponse({ description: 'no google access token' })
  async pushEvent(
    @Body() body: PushCalendarDto,
    @Req() req: Request & { user?: { googleAccessToken?: string } }
  ): Promise<any> {
    try {
      const googleAccessToken = req.user?.googleAccessToken;
      if (typeof googleAccessToken !== 'string' || !googleAccessToken) {
        this.logger.error('No google access token found for user');
        throw new BadRequestException('No google access token found for user');
      }

      const params = { ...JSON.parse(JSON.stringify(body)), access_token: googleAccessToken };

      const aiApiUrl = `${process.env.AI_URL ?? ''}/calendar/push`;
      if (!process.env.AI_URL) {
        throw new BadRequestException('AI_URL is not set');
      }
      const res = await axios.post(aiApiUrl, params);

      return res.data;
    } catch (err) {
      this.logger.error('push calendar event error: ' + (err instanceof Error ? err.message : String(err)));
      throw err;
    }
  }
}