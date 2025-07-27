import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;
@Schema({
  timestamps: true,
})
export class Service {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true, trim: true, minlength: 1 })
  name!: string;

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: true })
  isAvailable!: boolean;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
