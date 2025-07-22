import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PushCalendarDto } from './dto/push-calendar.dto';
console.log(PushCalendarDto);

@Controller('calendar')
export class CalendarController {
  @UseGuards(AuthGuard('jwt'))
  @Post('push')
  async pushEvent(@Body() body: PushCalendarDto, @Req() req: Request) {
    console.log('收到前端请求体:', body);
    console.log('收到前端请求体:', req.user);
    console.log('DTO类型:', Object.keys(body));
    try {
        console.log('收到前端请求体:', body);
        const googleAccessToken = (req.user as any).googleAccessToken;
        if (!googleAccessToken) {
          console.error('No google access token found for user');
          throw new BadRequestException('No google access token found for user');
        }
    
        const params = {
          ...body,
          access_token: googleAccessToken,
        };
    
        const aiApiUrl = process.env.AI_URL + '/calendar/push';
        const res = await axios.post(aiApiUrl, params);
        console.log('AI后端返回:', res.data);
    
        return res.data;
      } catch (err) {
        console.error('推送日历事件出错:', err);
        throw err;
      }
  }
}