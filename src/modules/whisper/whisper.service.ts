import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

import { openai } from '../../lib/openai';
import { TranscriptionResult, TranscriptionSegment } from './dto/transcription-result.dto';

@Injectable()
export class WhisperService {
  async transcribeFromUrl(url: string): Promise<TranscriptionResult> {
    const filePath = path.join('/tmp', `audio-${String(Date.now())}.wav`);
    const writer = fs.createWriteStream(filePath);

    const response = await axios.get(url, { responseType: 'stream' });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        resolve(true);
      });
      writer.on('error', reject);
    });

    const raw = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: fs.createReadStream(filePath),
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    fs.unlinkSync(filePath);

    const segments: TranscriptionSegment[] =
      raw.segments?.map((s: { start: number; end: number; text: string }) => ({
        start: s.start,
        end: s.end,
        text: s.text,
      })) ?? [];

    const result: TranscriptionResult = {
      text: raw.text,
      language: raw.language,
      segments,
    };

    return result;
  }
}
