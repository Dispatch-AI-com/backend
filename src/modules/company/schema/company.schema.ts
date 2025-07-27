import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Schema as MongooseSchema } from 'mongoose';

import { User } from '@/modules/user/schema/user.schema';

const DEFAULT_GREETING_MESSAGE = `Hello! I'm an Dispatch AI assistant working for you.

Your team is not available to take the call right now.

I can take a message for you, or help you book an appointment with your team. What can I do for you today?

你也可以和我说普通话。`;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true })
  businessName!: string;

  @Prop({
    type: {
      unitAptPOBox: { type: String },
      streetAddress: { type: String, required: true },
      suburb: { type: String, required: true },
      state: { type: String, required: true },
      postcode: { type: String, required: true },
    },
    required: true,
  })
  address!: {
    unitAptPOBox?: string;
    streetAddress: string;
    suburb: string;
    state: string;
    postcode: string;
  };

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true, unique: true })
  abn!: string;

  @Prop({ required: true })
  number!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user!: User;

  @Prop({ unique: true })
  twilioPhoneNumber!: string;

  @Prop({
    type: {
      message: {
        type: String,
      },
      isCustom: { type: Boolean, default: false },
    },
    default: () => ({
      message: DEFAULT_GREETING_MESSAGE,
      isCustom: false
    }),
  })
  greeting!: {
    message: string;
    isCustom: boolean;
  };
}

export type CompanyDocument = Company & Document;
export const CompanySchema = SchemaFactory.createForClass(Company);
