import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum VerificationType {
  SMS = 'SMS',
  EMAIL = 'Email',
  BOTH = 'Both',
}

@Schema({ timestamps: true })
export class Verification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: VerificationType,
    required: true,
    default: VerificationType.BOTH,
  })
  type!: VerificationType;

  @Prop()
  mobile?: string;

  @Prop()
  email?: string;

  @Prop({ default: false })
  mobileVerified!: boolean;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop({ default: false })
  marketingPromotions!: boolean;

  @Prop()
  readonly createdAt!: Date;

  @Prop()
  readonly updatedAt!: Date;
}

export type VerificationDocument = Verification & Document;
export const VerificationSchema = SchemaFactory.createForClass(Verification);
