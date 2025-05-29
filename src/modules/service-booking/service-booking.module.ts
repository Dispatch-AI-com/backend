import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceBooking, ServiceBookingSchema } from '@/modules/service-booking/schema/service-booking.schema';
import { ServiceBookingService } from '@/modules/service-booking/service-booking.service';
import { ServiceBookingController } from '@/modules/service-booking/service-booking.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceBooking.name, schema: ServiceBookingSchema },
    ]),
  ],
  providers: [ServiceBookingService],
  controllers: [ServiceBookingController],
  exports: [MongooseModule],
})
export class ServiceBookingModule {}