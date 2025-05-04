import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { UserStatus } from '../enum/userStatus.enum';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ required: true })
  fullPhoneNumber!: string;

  @Prop()
  readonly createdAt!: Date;

  @Prop()
  readonly updatedAt!: Date;

  @Prop({ default: true })
  receivedAdverts!: boolean;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.active,
  })
  status!: UserStatus;

  @Prop()
  statusReason!: string;

  @Prop({ default: 'user' })
  role!: string;
}

export type UserDocument = User & Document;
export const userSchema = SchemaFactory.createForClass(User);
