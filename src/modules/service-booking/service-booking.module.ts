import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { VerificationGuard } from '@/common/guards/verification.guard';
import {
  ServiceBooking,
  ServiceBookingSchema,
} from '@/modules/service-booking/schema/service-booking.schema';
import { ServiceBookingController } from '@/modules/service-booking/service-booking.controller';
import { ServiceBookingService } from '@/modules/service-booking/service-booking.service';
import { UserModule } from '@/modules/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceBooking.name, schema: ServiceBookingSchema },
    ]),
    UserModule,
  ],
  providers: [ServiceBookingService, VerificationGuard],
  controllers: [ServiceBookingController],
  exports: [ServiceBookingService, MongooseModule],
})
export class ServiceBookingModule {}
