import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ServiceFormField,
  ServiceFormFieldSchema,
} from './schema/service-form-field.schema';
import { ServiceFormFieldController } from './service-form-field.controller';
import { ServiceFormFieldService } from './service-form-field.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceFormField.name, schema: ServiceFormFieldSchema },
    ]),
  ],
  controllers: [ServiceFormFieldController],
  providers: [ServiceFormFieldService],
  exports: [ServiceFormFieldService],
})
export class ServiceFormFieldModule {}
