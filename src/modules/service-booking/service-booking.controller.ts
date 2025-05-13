import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { ServiceBookingService } from './service-booking.service';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';

@Controller('bookings')
export class ServiceBookingController {
  constructor(private readonly bookingService: ServiceBookingService) {}

  @Post()
  async createBooking(@Body() dto: CreateServiceBookingDto) {
    console.log('Received booking DTO:', dto);
    return this.bookingService.create(dto);
  }

  @Get()
  async findAllBookings() {
    return this.bookingService.findAll();
  }

  @Get(':id')
  async findOneBooking(@Param('id') id: string) {
    const booking = await this.bookingService.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
}