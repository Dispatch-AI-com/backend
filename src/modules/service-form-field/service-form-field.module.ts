import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceFormField, ServiceFormFieldSchema } from './schema/service-form-field.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceFormField.name, schema: ServiceFormFieldSchema },
    ]),
  ],
  exports: [MongooseModule], // 可导出给其他模块使用
})
export class ServiceFormFieldModule {}