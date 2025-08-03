import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GoogleCalendarAuthService } from '@/modules/user/google-calendar-auth.service';
import {
  GoogleCalendarAuth,
  GoogleCalendarAuthSchema,
} from '@/modules/user/schema/google-calendar-auth.schema';
import { User, userSchema } from '@/modules/user/schema/user.schema';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: GoogleCalendarAuth.name, schema: GoogleCalendarAuthSchema },
    ]),
  ],
  exports: [MongooseModule, UserService, GoogleCalendarAuthService],
  controllers: [UserController],
  providers: [UserService, GoogleCalendarAuthService],
})
export class UserModule {}
