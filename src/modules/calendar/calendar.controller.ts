import { Controller, Post, Body, Req, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PushCalendarDto } from './dto/push-calendar.dto';
import { ApiTags, ApiOkResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { GoogleCalendarAuthService } from '../user/google-calendar-auth.service';

interface CalendarEventResponse {
  success: boolean;
  eventId?: string;
  message?: string;
}

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly googleCalendarAuthService: GoogleCalendarAuthService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('push')
  @ApiOkResponse({ description: 'push calendar event success' })
  @ApiBadRequestResponse({ description: 'no google access token' })
  async pushEvent(
    @Body() body: PushCalendarDto,
    @Req() req: Request & { user?: { userId: string } }
  ): Promise<CalendarEventResponse> {
    try {
      const userId = req.user?.userId;
      if (!userId || userId.trim() === '') {
        throw new BadRequestException('User not authenticated');
      }

      // get google calendar auth by user id from database
      const googleAuth = await this.googleCalendarAuthService.getAuthByUserId(userId);
      if (!googleAuth?.accessToken) {
        throw new BadRequestException('Google Calendar not authorized');
      }

      // check if token is expired
      if (googleAuth.tokenExpiresAt && new Date() > googleAuth.tokenExpiresAt) {
        throw new BadRequestException('Google access token expired');
      }

      // call AI backend
      const params = {
        title: body.title,
        description: body.description,
        start: body.start,
        end: body.end,
        allDay: body.allDay,
        location: body.location,
        organizer: body.organizer,
        access_token: googleAuth.accessToken,
      };

      const aiApiUrl = process.env.AI_URL;
      if (!aiApiUrl) {
        throw new BadRequestException('AI service URL not configured');
      }
      
      const res = await axios.post(`${aiApiUrl}/calendar/push`, params);
      return res.data as CalendarEventResponse;
    } catch (err) {
      this.logger.error('push calendar event error: ' + (err instanceof Error ? err.message : String(err)));
      throw err;
    }
  }
}