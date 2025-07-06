// src/lib/twilio/twilio.module.ts
import { Global, Module } from '@nestjs/common';
import Twilio from 'twilio';

export const TWILIO_CLIENT = 'TWILIO_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: TWILIO_CLIENT,
      useFactory: (): Twilio.Twilio => {
        const accountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
        const authToken = process.env.TWILIO_AUTH_TOKEN ?? '';

        if (accountSid === '' || authToken === '') {
          throw new Error(
            'Twilio credentials not found in environment variables',
          );
        }

        return Twilio(accountSid, authToken, { accountSid });
      },
    },
  ],
  exports: [TWILIO_CLIENT],
})
export class TwilioModule {}
