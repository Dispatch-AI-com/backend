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

export function buildSayResponse({
  text,
  next,
  sid,
  publicUrl,
  language = IvrLanguage.EN_AU,
}: SayOptions): string {
  const vr = new twiml.VoiceResponse();
  vr.say({ language }, text);

  switch (next) {
    case NextAction.GATHER: {
      vr.gather({
        input: ['speech'],
        language,
        speechTimeout: 'auto',
        action: `${publicUrl}/telephony/gather?CallSid=${sid}`,
        method: 'POST',
      });
      break;
    }

    case NextAction.HANGUP: {
      vr.hangup();
      break;
    }

    default: {
      assertUnreachable(next);
    }
  }

  return vr.toString();
}
