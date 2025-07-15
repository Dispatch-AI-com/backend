import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceBookingDocument = ServiceBooking & Document;

@Schema({ timestamps: true })
export class ServiceBooking {
  @Prop({ required: true })
  serviceId!: string;

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

  @Prop({ enum: ['pending', 'confirmed', 'done'], default: 'pending' })
  status!: string;

  @Prop()
  note!: string;

  @Prop({ required: true })
  bookingTime!: Date;

  @Prop({ required: true })
  userId!: string;
}

export const ServiceBookingSchema =
  SchemaFactory.createForClass(ServiceBooking);
