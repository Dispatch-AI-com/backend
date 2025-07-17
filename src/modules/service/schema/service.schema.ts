import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ _id: false })
class Notification {
  @Prop({ required: false, enum: ['SMS', 'EMAIL', 'BOTH'] })
  preferNotificationType?: 'SMS' | 'EMAIL' | 'BOTH';

  @Prop({ required: false, match: /^[0-9]{11}$/ })
  phoneNumber?: string;

  @Prop({
    required: false,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  })
  email?: string;
}
const NotificationSchema = SchemaFactory.createForClass(Notification);

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

  @Prop({ type: NotificationSchema, required: false })
  notifications?: Notification;

  @Prop({ default: true })
  isAvailable!: boolean;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
