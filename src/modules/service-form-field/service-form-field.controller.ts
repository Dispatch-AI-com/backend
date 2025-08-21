import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';

import {
  ServiceFormField,
  ServiceFormFieldDocument,
} from './schema/service-form-field.schema';
import { ServiceFormFieldService } from './service-form-field.service';

// Define proper types for better type safety
interface CreateFormFieldDto {
  serviceId: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  options: string[];
}

interface UpdateFormFieldDto {
  fieldName?: string;
  fieldType?: string;
  isRequired?: boolean;
  options?: string[];
}

interface BatchSaveDto {
  fields: {
    fieldName?: string;
    fieldType?: string;
    isRequired?: boolean;
    options?: string[];
  }[];
}

@ApiTags('service-form-fields')
@Controller('service-form-fields')
export class ServiceFormFieldController {
  constructor(
    @InjectModel(ServiceFormField.name)
    private readonly formFieldModel: Model<ServiceFormFieldDocument>,
    private readonly serviceFormFieldService: ServiceFormFieldService,
  ) {}

  // Create a single form field
  @Post()
  @ApiOperation({ summary: 'Create a new service form field' })
  @ApiResponse({
    status: 201,
    type: ServiceFormField,
    description: 'Service form field created successfully.',
  })
  async create(
    @Body() createServiceFormFieldDto: CreateFormFieldDto,
  ): Promise<ServiceFormField> {
    return this.serviceFormFieldService.create(createServiceFormFieldDto);
  }

  // Query all form fields, supports filtering by serviceId
  @Get()
  @ApiOperation({ summary: 'Get all service form fields or by serviceId' })
  @ApiResponse({
    status: 200,
    type: [ServiceFormField],
    description: 'Return all service form fields or filtered by serviceId.',
  })
  async findAll(
    @Query('serviceId') serviceId?: string,
  ): Promise<ServiceFormField[]> {
    if (serviceId !== undefined && serviceId.trim() !== '') {
      return this.serviceFormFieldService.findByServiceId(serviceId);
    }
    return this.serviceFormFieldService.findAll();
  }

  // Query a single form field by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get a service form field by ID' })
  @ApiResponse({
    status: 200,
    type: ServiceFormField,
    description: 'Return a service form field by ID.',
  })
  async findOne(@Param('id') id: string): Promise<ServiceFormField | null> {
    return this.serviceFormFieldService.findOne(id);
  }

  // Update form field
  @Patch(':id')
  @ApiOperation({ summary: 'Update a service form field' })
  @ApiResponse({
    status: 200,
    type: ServiceFormField,
    description: 'Service form field updated successfully.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateServiceFormFieldDto: UpdateFormFieldDto,
  ): Promise<ServiceFormField | null> {
    return this.serviceFormFieldService.update(id, updateServiceFormFieldDto);
  }

  // Delete form field
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service form field' })
  @ApiResponse({
    status: 200,
    description: 'Service form field deleted successfully.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.serviceFormFieldService.remove(id);
  }

  // Batch save form fields (for Custom Form)
  @Post('batch/:serviceId')
  @ApiOperation({ summary: 'Save batch of form fields for a service' })
  @ApiResponse({
    status: 201,
    type: [ServiceFormField],
    description: 'Batch of form fields saved successfully.',
  })
  async saveBatch(
    @Param('serviceId') serviceId: string,
    @Body() body: BatchSaveDto,
  ): Promise<ServiceFormField[]> {
    const fields = body.fields;

    // Validate data
    if (!Array.isArray(fields)) {
      throw new Error('Fields must be an array');
    }

    return this.serviceFormFieldService.saveBatch(serviceId, fields);
  }
}
