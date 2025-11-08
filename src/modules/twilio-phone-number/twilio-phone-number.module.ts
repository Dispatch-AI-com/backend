import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  TwilioPhoneNumber,
  TwilioPhoneNumberSchema,
} from './schema/twilio-phone-number.schema';
import { TwilioPhoneNumberController } from './twilio-phone-number.controller';
import { TwilioPhoneNumberService } from './twilio-phone-number.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TwilioPhoneNumber.name, schema: TwilioPhoneNumberSchema },
    ]),
  ],
  controllers: [TwilioPhoneNumberController],
  providers: [TwilioPhoneNumberService],
  exports: [TwilioPhoneNumberService, MongooseModule],
})
export class TwilioPhoneNumberModule {}
