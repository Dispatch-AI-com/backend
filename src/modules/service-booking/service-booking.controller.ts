import { Body, Controller, Post } from '@nestjs/common';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';
import { ServiceBookingService } from './service-booking.service';

@Controller('bookings')
export class ServiceBookingController {
  constructor(private readonly bookingService: ServiceBookingService) {}

  @Post()
  async createBooking(@Body() dto: CreateServiceBookingDto) {
    return this.bookingService.create(dto);
  }
}