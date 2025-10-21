import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

import { User } from '@/modules/user/schema/user.schema';

export type CalendarTokenDocument = CalendarToken & Document;

@Schema({ timestamps: true })
export class CalendarToken {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  accessToken!: string;

  @Prop({ required: true })
  refreshToken!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ required: true })
  tokenType!: string;

  @Prop({ required: true })
  scope!: string;

  @Prop({ default: 'google' })
  provider!: string; // 'google' | 'outlook'

  @Prop()
  calendarId?: string;

  @Prop()
  googleUserId?: string;

  @Prop()
  userEmail?: string;

  @Prop()
  userName?: string;

  @Prop()
  userPicture?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  readonly createdAt!: Date;

  @Prop()
  readonly updatedAt!: Date;
}

export const CalendarTokenSchema = SchemaFactory.createForClass(CalendarToken);

// Create indexes to improve query performance
CalendarTokenSchema.index({ userId: 1 });
CalendarTokenSchema.index({ expiresAt: 1 });
CalendarTokenSchema.index({ provider: 1 });
// Ensure each user has only one active token (provider-agnostic, currently Google only)
CalendarTokenSchema.index({ userId: 1, isActive: 1 }, { unique: true });
