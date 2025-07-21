// src/modules/availability/availability.controller.ts
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { Availability } from './schema/availability.schema';

@ApiTags('Availability')
@Controller('availability')
@UseGuards(AuthGuard('jwt'))
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @ApiOperation({ summary: 'Create new availability' })
  @ApiResponse({
    status: 201,
    description: 'Availability created successfully',
    type: Availability,
  })
  async create(@Body() dto: CreateAvailabilityDto): Promise<Availability> {
    return this.availabilityService.create(dto);
  }

  @Get(':serviceId')
  @ApiOperation({ summary: 'Get availability by service ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns availability for the service',
    type: [Availability],
  })
  async findByService(
    @Param('serviceId') serviceId: string,
  ): Promise<Availability[]> {
    return this.availabilityService.findByServiceId(serviceId);
  }

  @Get('/weekly/:serviceId')
  @ApiOperation({ summary: 'Get weekly schedule for a service' })
  @ApiResponse({
    status: 200,
    description: 'Returns weekly schedule for the service',
    type: [Availability],
  })
  async getWeekly(
    @Param('serviceId') serviceId: string,
  ): Promise<Availability[]> {
    return this.availabilityService.getWeeklySchedule(serviceId);
  }

  @Patch('/:id/unavailable')
  @ApiOperation({ summary: 'Mark availability as unavailable' })
  @ApiResponse({
    status: 200,
    description: 'Availability marked as unavailable',
    type: Availability,
  })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  async markUnavailable(@Param('id') id: string): Promise<Availability> {
    const availability =
      await this.availabilityService.updateTemporaryUnavailability(id, false);
    if (!availability) {
      throw new NotFoundException(`Availability with id ${id} not found`);
    }
    return availability;
  }

  @Patch('/:id/available')
  @ApiOperation({ summary: 'Mark availability as available' })
  @ApiResponse({
    status: 200,
    description: 'Availability marked as available',
    type: Availability,
  })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  async markAvailable(@Param('id') id: string): Promise<Availability> {
    const availability =
      await this.availabilityService.updateTemporaryUnavailability(id, true);
    if (!availability) {
      throw new NotFoundException(`Availability with id ${id} not found`);
    }
    return availability;
  }
}
