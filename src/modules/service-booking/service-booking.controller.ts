import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateServiceBookingDto } from '@/modules/service-booking/dto/create-service-booking.dto';
import { ServiceBooking } from '@/modules/service-booking/schema/service-booking.schema';
import { ServiceBookingService } from '@/modules/service-booking/service-booking.service';

@ApiTags('service-bookings')
@Controller('bookings')
@UseGuards(AuthGuard('jwt'))
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
  async findAllBookings(
    @Query('userId') userId?: string,
  ): Promise<ServiceBooking[]> {
    return this.bookingService.findAll(userId);
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

  @Delete(':id')
  @ApiResponse({
    status: 200,
    schema: { example: { message: 'Booking deleted successfully' } },
    description: 'Booking deleted',
  })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async deleteBooking(@Param('id') id: string): Promise<{ message: string }> {
    const result = await this.bookingService.deleteById(id);
    if (!result) {
      throw new NotFoundException('Booking not found');
    }
    return { message: 'Booking deleted successfully' };
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    type: ServiceBooking,
    description: 'Updated booking',
  })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async updateBooking(
    @Param('id') id: string,
    @Body() dto: Partial<CreateServiceBookingDto>,
  ): Promise<ServiceBooking | null> {
    return this.bookingService.updateById(id, dto);
  }
}
