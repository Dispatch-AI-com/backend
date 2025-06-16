import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
  planId!: Types.ObjectId;

  @Prop({ required: false })
  subscriptionId?: string;

  @Prop({ required: false })
  stripeCustomerId?: string;

  @Prop({ required: false })
  chargeId?: string;

  @Prop({ required: false })
  startAt!: Date;

  @Prop({ required: false })
  endAt!: Date;

  @Prop({ required: true, enum: ['active', 'failed', 'cancelled'] })
  status!: 'active' | 'failed' | 'cancelled';

  @Prop({ required: false })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
