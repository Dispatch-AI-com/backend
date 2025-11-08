import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TwilioPhoneNumberDocument = TwilioPhoneNumber & Document;

export enum TwilioPhoneNumberStatus {
  available = 'available',
  assigned = 'assigned',
}

@Schema({ timestamps: true })
export class TwilioPhoneNumber {
  @Prop({ required: true, unique: true })
  phoneNumber!: string;

  @Prop({
    type: String,
    enum: TwilioPhoneNumberStatus,
    default: TwilioPhoneNumberStatus.available,
  })
  status!: TwilioPhoneNumberStatus;

  @Prop()
  readonly createdAt!: Date;

  @Prop()
  readonly updatedAt!: Date;
}

export const TwilioPhoneNumberSchema =
  SchemaFactory.createForClass(TwilioPhoneNumber);

// Indexes for efficient queries
TwilioPhoneNumberSchema.index({ status: 1 });
TwilioPhoneNumberSchema.index({ phoneNumber: 1 });
