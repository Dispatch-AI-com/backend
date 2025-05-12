import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true }) 
export class Subscription {
  @Prop({ required: true })
  companyId!: string;  // TODO: Change to ObjectId 

  @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
  planId!: Types.ObjectId;

  @Prop({ required: true })
  startAt!: Date;

  @Prop({ required: true })
  endAt!: Date;

  @Prop({ required: true, enum: ['active', 'cancelled', 'expired'], default: 'active' })
  status!: 'active'| 'cancelled'| 'expired';
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
