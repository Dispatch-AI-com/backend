import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type ServiceBookingDocument = ServiceBooking & Document;

@Schema({ timestamps: true })
export class ServiceBooking {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  })
  serviceId!: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  companyId!: mongoose.Types.ObjectId;

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
}

export const ServiceBookingSchema =
  SchemaFactory.createForClass(ServiceBooking);
