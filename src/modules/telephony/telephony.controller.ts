import { Body, Controller, Header, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SkipCSRF } from '@/common/decorators/skip-csrf.decorator';
import {
  type VoiceGatherBody,
  type VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { TelephonyService } from '@/modules/telephony/telephony.service';

@ApiTags('telephony')
@Controller('telephony')
@SkipCSRF()
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
    return this.telephonyService.handleVoice(body);
  }

  @Post('gather')
  @HttpCode(200)
  @Header('Content-Type', 'text/xml')
  @ApiOperation({ summary: 'Handle Twilio Gather Webhook' })
  @ApiResponse({
    status: 200,
    description: 'TwiML XML response to control the call',
    type: String,
  })
  async handleGather(@Body() body: VoiceGatherBody): Promise<string> {
    return await this.telephonyService.handleGather(body);
  }

  @Post('status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Twilio Status Callback' })
  @ApiResponse({ status: 200, description: 'OK' })
  async handleStatus(@Body() body: VoiceStatusBody): Promise<void> {
    await this.telephonyService.handleStatus(body);
  }
}
