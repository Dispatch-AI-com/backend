import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { TranscriptionResult } from './dto/transcription-result.dto';
import { WhisperTranscriptionException } from './exceptions/whisper-transcription.exception';
import { WhisperService } from './whisper.service';

@Controller('whisper')
@ApiTags('whisper')
export class WhisperController {
  constructor(private readonly whisperService: WhisperService) {}

  @Get('transcribe')
  @ApiQuery({ name: 'url', required: true, description: 'Public audio file URL (wav/mp3)' })
  @ApiOkResponse({ description: 'Transcription result' })
  async transcribe(@Query('url') url: string): Promise<TranscriptionResult> {
    if (!url) {
      throw new BadRequestException('Missing "url" query param');
    }
    const result = await this.whisperService.transcribeFromUrl(url);
    return result;
  }
}
