import { Controller, Post, Body, Req, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PushCalendarDto } from './dto/push-calendar.dto';
import { ApiTags, ApiOkResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { GoogleCalendarAuthService } from '../user/google-calendar-auth.service';

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
  ): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      // 从数据库获取 Google 授权信息
      const googleAuth = await this.googleCalendarAuthService.getAuthByUserId(userId);
      if (!googleAuth || !googleAuth.accessToken) {
        throw new BadRequestException('Google Calendar not authorized');
      }

      // 检查 token 是否过期
      if (googleAuth.tokenExpiresAt && new Date() > googleAuth.tokenExpiresAt) {
        throw new BadRequestException('Google access token expired');
      }

      // 调用 AI 后端
      const params = {
        ...body,
        access_token: googleAuth.accessToken,
      };

      const aiApiUrl = `${process.env.AI_URL}/calendar/push`;
      const res = await axios.post(aiApiUrl, params);
      return res.data;
    } catch (err) {
      this.logger.error('push calendar event error: ' + (err instanceof Error ? err.message : String(err)));
      throw err;
    }
  }
}