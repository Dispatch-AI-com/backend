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
          // In development, allow service to start without Twilio credentials
          if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
            console.warn('⚠️  Twilio credentials not found. Twilio features will be disabled.');
            // Return a mock Twilio client for development
            return {
              calls: {
                create: () => Promise.reject(new Error('Twilio not configured')),
                list: () => Promise.resolve([]),
              },
              messages: {
                create: () => Promise.reject(new Error('Twilio not configured')),
                list: () => Promise.resolve([]),
              },
            } as any;
          }
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
