import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

import { User } from '@/modules/user/schema/user.schema';

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
