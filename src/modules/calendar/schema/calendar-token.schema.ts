import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

import { User } from '@/modules/user/schema/user.schema';

export type CalendarTokenDocument = CalendarToken & Document;

@Schema({ timestamps: true })
export class CalendarToken {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  accessToken!: string;

  @Prop({ required: true })
  refreshToken!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ required: true })
  tokenType!: string;

  @Prop({ required: true })
  scope!: string;

  @Prop({ default: 'google' })
  provider!: string; // 'google' | 'outlook'

  @Prop()
  calendarId?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  readonly createdAt!: Date;

  @Prop()
  readonly updatedAt!: Date;
}

export const CalendarTokenSchema = SchemaFactory.createForClass(CalendarToken);

// 创建索引以提高查询性能
CalendarTokenSchema.index({ userId: 1 });
CalendarTokenSchema.index({ expiresAt: 1 });
CalendarTokenSchema.index({ provider: 1 });
// 确保每个用户的每个提供商只有一个活跃令牌
CalendarTokenSchema.index({ userId: 1, provider: 1, isActive: 1 }, { unique: true });
