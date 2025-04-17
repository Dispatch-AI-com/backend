import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PlanDocument = HydratedDocument<Plan>;

@Schema()
export class Plan {

  @ApiProperty({ description: 'Plan name', example: 'Free' })
  @Prop({ required: true, unique: true })
  name: string;

  @ApiProperty({ description: 'Plan tier', example: 'FREE | BASIC | PRO' })
  @Prop({ required: true, enum: ['FREE', 'BASIC', 'PRO'] })
  tier: 'FREE' | 'BASIC' | 'PRO';

  @ApiProperty({
    description: 'Pricing options with flexible billing using rrule format',
    example: [
      { rrule: 'FREQ=MONTHLY;INTERVAL=1', price: 49 },
      { rrule: 'FREQ=MONTHLY;INTERVAL=3', price: 129 },
      { rrule: 'FREQ=YEARLY;INTERVAL=1', price: 499 }
    ]
  })
  @Prop({
    type: [
      {
        rrule: { type: String, required: true },  // e.g. "FREQ=MONTHLY;INTERVAL=1"
        price: { type: Number, required: true },
      }
    ],
    required: true
  })
  pricing: {
    rrule: string;
    price: number;
  }[];

  @ApiProperty({ description: 'Plan features', example: {
    callMinutes: 'Unlimited',
    support: 'Basic support'
  }})
  @Prop({
    type: {
      callMinutes: { type: String, required: true },
      support: { type: String, required: true },
    },
    required: true
  })
  features: {
    callMinutes: string;
    support: string;
  };

  @ApiProperty({ description: 'Plan is active or not', example: true })
  @Prop({ default: true })
  isActive: boolean;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
