import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceFormField, ServiceFormFieldSchema } from './schema/service-form-field.schema';
import { ServiceFormFieldController } from './service-form-field.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceFormField.name, schema: ServiceFormFieldSchema },
    ]),
  ],
  controllers: [ServiceFormFieldController], 
})
export class ServiceFormFieldModule {}