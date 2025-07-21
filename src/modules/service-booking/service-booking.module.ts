import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Service,
  ServiceSchema,
} from '@/modules/service/schema/service.schema';
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
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  providers: [ServiceBookingService],
  controllers: [ServiceBookingController],
  exports: [MongooseModule],
})
export class ServiceBookingModule {}
