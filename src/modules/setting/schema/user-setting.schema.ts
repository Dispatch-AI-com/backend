import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import { SettingCategory } from './setting.schema';

@Schema({ timestamps: true })
export class UserSetting extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: SettingCategory,
    required: true,
  })
  category!: SettingCategory;

  @Prop({ type: Object, required: true })
  settings!: Record<string, any>;

  @Prop()
  readonly createdAt!: Date;

  @Prop()
  readonly updatedAt!: Date;
}

export type UserSettingDocument = UserSetting & Document;
export const userSettingSchema = SchemaFactory.createForClass(UserSetting);

userSettingSchema.index({ userId: 1, category: 1 }, { unique: true });
