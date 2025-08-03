import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class GoogleCalendarAuth extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  accessToken!: string;

  @Prop()
  refreshToken?: string;

  @Prop()
  tokenExpiresAt?: Date;
}

export type GoogleCalendarAuthDocument = GoogleCalendarAuth & Document;
export const GoogleCalendarAuthSchema =
  SchemaFactory.createForClass(GoogleCalendarAuth);
