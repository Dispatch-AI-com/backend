import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true }) 
export class Subscription {
  @Prop({ required: true })
  companyId!: string;  // TODO: Change to ObjectId 

  @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
  planId!: Types.ObjectId;

  @Prop({ required: false }) 
  startAt?: Date;

  @Prop({ required: false }) 
  endAt?: Date;

  @Prop({ required: true, enum: ['active', 'cancelled', 'expired', 'pending']})
  status!: 'active' | 'cancelled' | 'expired' | 'pending';

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
