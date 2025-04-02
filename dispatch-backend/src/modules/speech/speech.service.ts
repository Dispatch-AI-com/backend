import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

@Injectable()
export class SpeechService {
  async textToSpeech(text: string): Promise<Buffer> {
    if (!text?.trim()) {
      throw new BadRequestException('Text to synthesize is empty');
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION!,
    );
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (result) => {
          synthesizer.close();
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(Buffer.from(result.audioData));
          } else {
            reject(
              new InternalServerErrorException(
                `TTS failed: ${result.errorDetails}`,
              ),
            );
          }
        },
        (err) => {
          synthesizer.close();
          reject(new InternalServerErrorException(`TTS error: ${err}`));
        },
      );
    });
  }
}
