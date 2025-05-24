import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AvailabilityDocument = Availability & Document;

@Schema({ timestamps: true })
export class Availability {
  @Prop({ required: true })
  serviceId!: string;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  repeatRule!: string;

  @Prop({ required: true })
  startTime!: string;

  @Prop({ required: true })
  endTime!: string;

  @Prop({ default: true })
  isAvailable!: boolean;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);
