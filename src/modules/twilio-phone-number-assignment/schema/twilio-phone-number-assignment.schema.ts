import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TwilioPhoneNumberAssignmentDocument = TwilioPhoneNumberAssignment &
  Document;

export enum TwilioPhoneNumberAssignmentStatus {
  active = 'active',
  expired = 'expired',
}

@Schema({ timestamps: true })
export class TwilioPhoneNumberAssignment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'TwilioPhoneNumber',
    required: true,
  })
  phoneNumberId!: Types.ObjectId;

  @Prop({ required: true })
  phoneNumber!: string;

  @Prop({ required: true })
  assignedAt!: Date;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({
    type: String,
    enum: TwilioPhoneNumberAssignmentStatus,
    default: TwilioPhoneNumberAssignmentStatus.active,
  })
  status!: TwilioPhoneNumberAssignmentStatus;

  @Prop()
  readonly createdAt!: Date;

  @Prop()
  readonly updatedAt!: Date;
}

export const TwilioPhoneNumberAssignmentSchema = SchemaFactory.createForClass(
  TwilioPhoneNumberAssignment,
);

TwilioPhoneNumberAssignmentSchema.index({ userId: 1, status: 1 });
TwilioPhoneNumberAssignmentSchema.index({ phoneNumber: 1, status: 1 });
TwilioPhoneNumberAssignmentSchema.index({ expiresAt: 1, status: 1 });
TwilioPhoneNumberAssignmentSchema.index({ phoneNumberId: 1 });
