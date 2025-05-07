// src/whisper/whisper.module.ts
import { Module } from '@nestjs/common';

import { WhisperController } from './whisper.controller';
import { WhisperService } from './whisper.service';

@Module({
  providers: [WhisperService],
  controllers: [WhisperController],
  exports: [WhisperService],
})
export class WhisperModule {}
