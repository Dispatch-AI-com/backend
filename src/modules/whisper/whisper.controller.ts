// src/whisper/whisper.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { TranscriptionResult } from './dto/transcription-result.dto';
import { WhisperService } from './whisper.service';
@Controller('whisper')
@ApiTags('whisper')
export class WhisperController {
  constructor(private readonly whisperService: WhisperService) {}

  @Get('transcribe')
  @ApiOkResponse({ description: 'Transcription result' })
  async transcribe(@Query('url') url: string): Promise<TranscriptionResult> {
    if (!url) {
      throw new Error('Missing "url" query param');
    }

    const result: TranscriptionResult = await this.whisperService.transcribeFromUrl(url);
    return result;
  }
}
