import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
  planId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Plan', required: false })
  pendingPlanId?: Types.ObjectId;

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

  @Prop({
    required: true,
    enum: [
      'active',
      'failed',
      'cancelled',
      'pending_cancellation',
      'pending_downgrade',
    ],
  })
  status!:
    | 'active'
    | 'failed'
    | 'cancelled'
    | 'pending_cancellation'
    | 'pending_downgrade';

  @Prop({ required: true, default: 0 })
  secondsLeft!: number;

  @Prop({ required: true, default: 60 })
  billGranularitySec!: number;

  @Prop({ required: false })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ status: 1, endAt: 1 });
