import { Controller, Post, Body } from '@nestjs/common';
import { SpeechService } from './speech.service';

@Controller('speech')
export class SpeechController {
  constructor(private readonly speechService: SpeechService) {}

  @Post('textToSpeech')
  async textToSpeech(@Body('text') text: string): Promise<Buffer> {
    return await this.speechService.textToSpeech(text);
  }
}
