import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateServiceBookingDto } from '@/modules/service-booking/dto/create-service-booking.dto';
import { ServiceBooking } from '@/modules/service-booking/schema/service-booking.schema';
import { ServiceBookingService } from '@/modules/service-booking/service-booking.service';

@ApiTags('service-bookings')
@Controller('bookings')
export class ServiceBookingController {
  constructor(private readonly bookingService: ServiceBookingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service booking' })
  @ApiResponse({
    status: 201,
    type: ServiceBooking,
    description: 'The booking has been successfully created.',
  })
  async createBooking(
    @Body() dto: CreateServiceBookingDto,
  ): Promise<ServiceBooking> {
    return this.bookingService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all service bookings' })
  @ApiResponse({
    status: 200,
    type: [ServiceBooking],
    description: 'Return all service bookings.',
  })
  async findAllBookings(): Promise<ServiceBooking[]> {
    return this.bookingService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service booking by id' })
  @ApiResponse({
    status: 200,
    type: ServiceBooking,
    description: 'Return the service booking.',
  })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async findOneBooking(@Param('id') id: string): Promise<ServiceBooking> {
    const booking = await this.bookingService.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
}
