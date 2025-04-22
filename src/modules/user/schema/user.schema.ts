import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true })
  fullPhoneNumber: string;

  @Prop()
  readonly createdAt: Date;

  @Prop()
  readonly updatedAt: Date;

  @Prop({ default: true })
  receivedAdverts: boolean;

  @Prop({ default: 1 })
  status: number;
  // 1: active, 2: banned for 7 days, 3: banned for 30 days, 4: banned for 90 days, 5: banned for 180 days, 6: banned for 365 days, 7: banned permanently

  @Prop()
  statusReason: string;

  @Prop({ default: 'user' })
  role: string;



}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);