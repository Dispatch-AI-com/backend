import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Subscription,
  SubscriptionSchema,
} from '../subscription/schema/subscription.schema';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TwilioPhoneNumberModule } from '../twilio-phone-number/twilio-phone-number.module';
import {
  TwilioPhoneNumberAssignment,
  TwilioPhoneNumberAssignmentSchema,
} from './schema/twilio-phone-number-assignment.schema';
import { TwilioPhoneNumberAssignmentService } from './twilio-phone-number-assignment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TwilioPhoneNumberAssignment.name,
        schema: TwilioPhoneNumberAssignmentSchema,
      },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    TwilioPhoneNumberModule,
    forwardRef(() => SubscriptionModule),
  ],
  providers: [TwilioPhoneNumberAssignmentService],
  exports: [TwilioPhoneNumberAssignmentService, MongooseModule],
})
export class TwilioPhoneNumberAssignmentModule {}
