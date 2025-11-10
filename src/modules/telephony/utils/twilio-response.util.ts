import { twiml } from 'twilio';

import { assertUnreachable } from '@/utils/assert-unreachable';

export enum NextAction {
  GATHER = 'GATHER',
  HANGUP = 'HANGUP',
}

export enum IvrLanguage {
  EN_AU = 'en-AU',
  EN_US = 'en-US',
}

export interface SayOptions {
  text: string;
  next: NextAction;
  sid: string;
  publicUrl: string;
  language?: IvrLanguage;
}

function estimateGatherTimeout(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  // Assume ~0.6 seconds per word, add buffer, clamp between 15 and 60 seconds
  const estimatedSpeechSeconds = Math.ceil(words * 0.6);
  const timeoutWithBuffer = estimatedSpeechSeconds + 7;

  return Math.min(60, Math.max(15, timeoutWithBuffer));
}

export function buildSayResponse({
  text,
  next,
  sid,
  publicUrl,
  language = IvrLanguage.EN_AU,
}: SayOptions): string {
  const vr = new twiml.VoiceResponse();

  switch (next) {
    case NextAction.GATHER: {
      const gatherTimeout = estimateGatherTimeout(text);

      const gather = vr.gather({
        input: ['speech'],
        language,
        speechTimeout: '3', // Wait 3 seconds after speech ends
        timeout: gatherTimeout, // Allow full greeting playback before waiting for speech
        action: `${publicUrl}/telephony/gather?CallSid=${sid}`,
        method: 'POST',
      });
      gather.say({ language }, text);
      break;
    }

    case NextAction.HANGUP: {
      vr.say({ language }, text);
      vr.hangup();
      break;
    }

    default: {
      assertUnreachable(next);
    }
  }

  return vr.toString();
}
