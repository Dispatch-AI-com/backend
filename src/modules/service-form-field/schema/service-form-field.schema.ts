import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceFormFieldDocument = ServiceFormField & Document;

@Schema({ timestamps: true })
export class ServiceFormField {
  @Prop({ required: true })
  serviceId!: string;

  @Prop({ required: true })
  fieldName!: string;

  @Prop({ required: true })
  fieldType!: string;

  @Prop({ default: false })
  isRequired!: boolean;

  @Prop({ type: [String], default: [] })
  options!: string[];
}

export const ServiceFormFieldSchema = SchemaFactory.createForClass(ServiceFormField);