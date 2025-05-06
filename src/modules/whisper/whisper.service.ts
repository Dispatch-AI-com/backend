import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { toFile } from 'openai';

import { openai } from '../../lib/openai';
import { TranscriptionResult, TranscriptionSegment } from './dto/transcription-result.dto';
import { WhisperTranscriptionException } from './exceptions/whisper-transcription.exception';

@Injectable()
export class WhisperService {
  async transcribeFromUrl(url: string): Promise<TranscriptionResult> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      const file = await toFile(buffer, 'audio.wav');

      const raw = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      const segments: TranscriptionSegment[] =
        raw.segments?.map((s: { start: number; end: number; text: string }) => ({
          start: s.start,
          end: s.end,
          text: s.text,
        })) ?? [];

      return {
        text: raw.text,
        language: raw.language,
        segments,
      };
    } catch (err: unknown) {
      throw new WhisperTranscriptionException(`Transcription failed: ${(err as Error).message}`);
    }
  }
}
