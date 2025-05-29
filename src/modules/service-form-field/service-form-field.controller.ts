import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';

import {
  ServiceFormField,
  ServiceFormFieldDocument,
} from '@/modules/service-form-field/schema/service-form-field.schema';

@ApiTags('service-form-fields')
@Controller('service-form-fields')
export class ServiceFormFieldController {
  constructor(
    @InjectModel(ServiceFormField.name)
    private readonly formFieldModel: Model<ServiceFormFieldDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all service form fields' })
  @ApiResponse({
    status: 200,
    type: [ServiceFormField],
    description: 'Return all service form fields.',
  })
  async findAll(): Promise<ServiceFormField[]> {
    return this.formFieldModel.find().exec();
  }
}
