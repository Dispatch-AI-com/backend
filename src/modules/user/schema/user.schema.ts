import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { EUserRole } from '@/common/constants/user.constant';

import { UserStatus } from '../enum/userStatus.enum';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop()
  firstName!: string;

  @Prop()
  lastName!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: false, select: false })
  password?: string;

  @Prop()
  twilioPhoneNumber!: string;

  @Prop()
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

  @Prop()
  position!: string;

  @Prop({
    type: String,
    enum: EUserRole,
    default: EUserRole.user,
  })
  role!: EUserRole;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop({ default: false })
  phoneVerified!: boolean;
}

export type UserDocument = User & Document;
export const userSchema = SchemaFactory.createForClass(User);
