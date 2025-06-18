import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import {
  VoiceGatherBody,
  VoiceRecordingBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { TelephonyService } from '@/modules/telephony/telephony.service';

@ApiTags('telephony')
@Controller('telephony')
export class TelephonyController {
  constructor(private readonly telephonyService: TelephonyService) {}

  @Post('voice')
  @HttpCode(200)
  @Header('Content-Type', 'text/xml')
  @ApiOperation({ summary: 'Handle Twilio Voice Webhook' })
  @ApiResponse({
    status: 200,
    description: 'TwiML XML response to control the call',
    type: String,
  })
  async handleVoice(@Body() body: VoiceGatherBody): Promise<string> {
    return this.telephonyService.handleVoiceWebhook(body);
  }

  @Post('recording')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Twilio Recording Status Callback' })
  @ApiResponse({ status: 200, description: 'OK' })
  handleRecording(@Body() body: VoiceRecordingBody): void {
    this.telephonyService.handleRecording(body);
  }

  @Post('status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Twilio Status Callback' })
  @ApiResponse({ status: 200, description: 'OK' })
  handleStatus(@Body() body: VoiceStatusBody): void {
    void this.telephonyService.handleCallStatus(body);
  }

  @Post('enter-conference')
  @HttpCode(200)
  @Header('Content-Type', 'text/xml')
  @ApiOperation({ summary: 'Join Conference Room with Bot' })
  @ApiResponse({ status: 200, description: 'Conference TwiML XML' })
  handleEnterConference(
    @Query('CallSid') callSid: string,
    @Query('To') to: string,
    @Res() res: Response,
  ): void {
    res.send(this.telephonyService.handleEnterConference(callSid, to));
  }
}
