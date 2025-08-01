import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ServiceBooking,
  ServiceBookingSchema,
} from '@/modules/service-booking/schema/service-booking.schema';
import { ServiceBookingController } from '@/modules/service-booking/service-booking.controller';
import { ServiceBookingService } from '@/modules/service-booking/service-booking.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceBooking.name, schema: ServiceBookingSchema },
    ]),
  ],
  providers: [ServiceBookingService],
  controllers: [ServiceBookingController],
  exports: [ServiceBookingService, MongooseModule],
})
export class ServiceBookingModule {}
