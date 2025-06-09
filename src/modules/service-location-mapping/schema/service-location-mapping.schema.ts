import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ServiceLocationMappingDocument =
  HydratedDocument<ServiceLocationMapping>;

@Schema({
  timestamps: true,
})
export class ServiceLocationMapping {
  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  locationId!: Types.ObjectId;
}

export const ServiceLocationMappingSchema = SchemaFactory.createForClass(
  ServiceLocationMapping,
);
