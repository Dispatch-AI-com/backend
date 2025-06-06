import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateServiceLocationMappingDto } from './dto/create-service-location-mapping.dto';
import { UpdateServiceLocationMappingDto } from './dto/update-service-location-mapping.dto';
import { ServiceLocationMapping } from './schema/service-location-mapping.schema';
import { ServiceLocationMappingService } from './service-location-mapping.service';

@ApiTags('service-location-mapping')
@Controller('service-location-mapping')
export class ServiceLocationMappingController {
  constructor(
    private readonly serviceLocationMappingService: ServiceLocationMappingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service-location mapping' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The service-location mapping has been successfully created.',
    type: CreateServiceLocationMappingDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(
    @Body() createServiceLocationMappingDto: CreateServiceLocationMappingDto,
  ): Promise<ServiceLocationMapping> {
    return this.serviceLocationMappingService.create(
      createServiceLocationMappingDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all service-location mappings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all service-location mappings.',
    type: [CreateServiceLocationMappingDto],
  })
  async findAll(): Promise<ServiceLocationMapping[]> {
    return this.serviceLocationMappingService.findAll();
  }

  @Get('location/:locationId')
  @ApiOperation({ summary: 'Get all services for a location' })
  @ApiParam({ name: 'locationId', description: 'Location ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all services for the location.',
    type: [CreateServiceLocationMappingDto],
  })
  async findByLocationId(
    @Param('locationId') locationId: string,
  ): Promise<ServiceLocationMapping[]> {
    return this.serviceLocationMappingService.findByLocationId(locationId);
  }

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Get all locations for a service' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all locations for the service.',
    type: [CreateServiceLocationMappingDto],
  })
  async findByServiceId(
    @Param('serviceId') serviceId: string,
  ): Promise<ServiceLocationMapping[]> {
    return this.serviceLocationMappingService.findByServiceId(serviceId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service-location mapping' })
  @ApiParam({ name: 'id', description: 'Service-location mapping ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The service-location mapping has been successfully updated.',
    type: CreateServiceLocationMappingDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service-location mapping not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateServiceLocationMappingDto: UpdateServiceLocationMappingDto,
  ): Promise<ServiceLocationMapping> {
    return this.serviceLocationMappingService.update(
      id,
      updateServiceLocationMappingDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service-location mapping' })
  @ApiParam({ name: 'id', description: 'Service-location mapping ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The service-location mapping has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service-location mapping not found.',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.serviceLocationMappingService.remove(id);
    return { message: 'Service-location mapping deleted successfully.' };
  }
}
