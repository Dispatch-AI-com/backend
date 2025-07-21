import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type ServiceBookingDocument = ServiceBooking & Document;

@Schema({ timestamps: true })
export class ServiceBooking {
  @Prop({ required: true })
  serviceId!: string;

  @Prop({ required: true })
  companyId!: string;

  @Prop({
    type: {
      name: { type: String },
      phoneNumber: { type: String },
      address: { type: String },
    },
  })
  client!: {
    name: string;
    phoneNumber: string;
    address: string;
  };

  @Prop({
    type: [
      {
        serviceFieldId: { type: String },
        answer: { type: String },
      },
    ],
  })
  serviceFormValues!: {
    serviceFieldId: string;
    answer: string;
  }[];

  @Prop({ enum: ['task', 'completed', 'missed', 'followup'], default: 'task' })
  status!: 'task' | 'completed' | 'missed' | 'followup';

  @Prop()
  note!: string;

  @Prop({ required: true })
  bookingTime!: Date;

  @Prop({ required: true })
  userId!: string;
}

export const ServiceBookingSchema =
  SchemaFactory.createForClass(ServiceBooking);
