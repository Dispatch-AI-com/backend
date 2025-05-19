import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationService } from './location.service';
import { Location } from './schema/location.schema';

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The location has been successfully created.',
    type: CreateLocationDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(
    @Body() createLocationDto: CreateLocationDto,
  ): Promise<Location> {
    return this.locationService.create(createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all locations.',
    type: [CreateLocationDto],
  })
  async findAll(): Promise<Location[]> {
    return this.locationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location by id' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the location.',
    type: CreateLocationDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Location not found.',
  })
  async findOne(@Param('id') id: string): Promise<Location> {
    return this.locationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a location' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The location has been successfully updated.',
    type: CreateLocationDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Location not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    return this.locationService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a location' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The location has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Location not found.',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.locationService.remove(id);
    return { message: `Location deleted successfully.` };
  }
}
