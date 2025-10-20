import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

import { User } from '@/modules/user/schema/user.schema';

// const DEFAULT_GREETING_MESSAGE = `Hello! I'm an Dispatch AI assistant working for you.
//
// Your team is not available to take the call right now.
//
// I can take a message for you, or help you book an appointment with your team. What can I do for you today?
//
// You can also speak to me in Mandarin Chinese.`;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true })
  businessName!: string;

  @Prop({ required: true, unique: true })
  abn!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user!: User;
  @Prop()
  calendar_access_token?: string;

  _id!: Types.ObjectId;
}

export type CompanyDocument = Company & Document;
export const CompanySchema = SchemaFactory.createForClass(Company);
