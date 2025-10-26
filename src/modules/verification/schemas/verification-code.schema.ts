import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class VerificationCode extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  contact!: string; // email or phone number

  @Prop({ required: true })
  code!: string;

  @Prop({ required: true, enum: ['email', 'phone'] })
  type!: 'email' | 'phone';

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ required: true, default: Date.now })
  sentAt!: Date; // Track when the code was sent for cooldown

  @Prop()
  readonly createdAt!: Date;

  @Prop()
  readonly updatedAt!: Date;
}

export type VerificationCodeDocument = VerificationCode & Document;
export const VerificationCodeSchema =
  SchemaFactory.createForClass(VerificationCode);

// Add TTL index for automatic cleanup
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

