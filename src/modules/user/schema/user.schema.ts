import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import { EUserRole } from '@/common/constants/user.constant';

import { UserStatus } from '../enum/userStatus.enum';

// Add the greeting message
const DEFAULT_GREETING_MESSAGE = `Hello! I'm an Dispatch AI assistant working for you.

Your team is not available to take the call right now.

I can take a message for you, or help you book an appointment with your team. What can I do for you today?

你也可以和我说普通话。`;

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

  @Prop({ required: false })
  twilioPhoneNumber?: string;

  @Prop({ required: false })
  fullPhoneNumber?: string;

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

  // Add billing address
  @Prop({
    type: {
      unitAptPOBox: { type: String },
      streetAddress: { type: String, required: true },
      suburb: { type: String, required: true },
      state: { type: String, required: true },
      postcode: { type: String, required: true },
    },
    required: false,
  })
  address?: {
    unitAptPOBox?: string;
    streetAddress: string;
    suburb: string;
    state: string;
    postcode: string;
  };

  // Add greeting message
  @Prop({
    type: {
      message: {
        type: String,
      },
      isCustom: { type: Boolean, default: false },
    },
    default: () => ({
      message: DEFAULT_GREETING_MESSAGE,
      isCustom: false,
    }),
  })
  greeting!: {
    message: string;
    isCustom: boolean;
  };
}

export type UserDocument = User & Document;
export const userSchema = SchemaFactory.createForClass(User);

export { UserStatus };
