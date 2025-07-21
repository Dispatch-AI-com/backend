import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum SettingCategory {
  USER_PROFILE = 'user_profile',
  COMPANY_INFO = 'company_info',
  BILLING_ADDRESS = 'billing_address',
}

@Schema({ timestamps: true })
export class Setting extends Document {
  @Prop({ required: true, unique: true })
  key!: string;

  @Prop({ required: true })
  value!: string;

  @Prop({
    type: String,
    enum: SettingCategory,
    required: true,
  })
  category!: SettingCategory;

  @Prop()
  description?: string;

  @Prop()
  readonly createdAt!: Date;

  @Prop()
  readonly updatedAt!: Date;
}

export type SettingDocument = Setting & Document;
export const settingSchema = SchemaFactory.createForClass(Setting);
