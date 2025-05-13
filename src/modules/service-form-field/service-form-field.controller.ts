import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceFormField, ServiceFormFieldDocument } from './schema/service-form-field.schema';

@Controller('service-form-fields')
export class ServiceFormFieldController {
  constructor(
    @InjectModel(ServiceFormField.name)
    private readonly formFieldModel: Model<ServiceFormFieldDocument>,
  ) {}

  @Get()
  async findAll(): Promise<ServiceFormField[]> {
    return this.formFieldModel.find().exec();
  }
}