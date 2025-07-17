import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ServiceFormField,
  ServiceFormFieldSchema,
} from '@/modules/service-form-field/schema/service-form-field.schema';
import { ServiceFormFieldController } from '@/modules/service-form-field/service-form-field.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceFormField.name, schema: ServiceFormFieldSchema },
    ]),
  ],
  controllers: [ServiceFormFieldController],
})
export class ServiceFormFieldModule {}
