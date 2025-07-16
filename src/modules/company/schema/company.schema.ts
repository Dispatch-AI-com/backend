import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

import { User } from '@/modules/user/schema/user.schema';

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

  @Prop({ required: false, unique: true })
  twilioPhoneNumber?: string;
}

export type CompanyDocument = Company & Document;
export const CompanySchema = SchemaFactory.createForClass(Company);
