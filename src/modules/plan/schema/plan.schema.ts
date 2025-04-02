import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { billingCycle } from '@/common/constants/plan.constant';
import { ApiProperty } from '@nestjs/swagger';

export type PlanDocument = HydratedDocument<Plan>

@Schema()
export class Plan {

  @ApiProperty({
    description: 'Plan name',
    example: 'Silver Plan',
  }
  )
  @Prop({ required: true, unique: true, maxlength: 20 })
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'This is the Silver Plan',
  })
  @Prop({ required: true, maxlength: 200 })
  description: string;

  @ApiProperty({
    description: 'Plan tier',
    example: 'Silver',
  })
  @Prop({ required: true })
  tier: string;

  // @ApiProperty({
  //   description: 'Plan price',
  //   example: 100,
  // })
  // @Prop({ required: true })
  // price: number;

  // @ApiProperty({
  //   description: 'Plan billing cycle',
  //   example: 'monthly',
  // })
  // @Prop({ required: true, enum: billingCycle  })
  // billingCycle: string;
  @ApiProperty({
    description: 'Plan pricing',
    example: [
      {
        billingPeriod: 'MONTHLY',
        monthlyPayment: 100,
      },
      {
        billingPeriod: 'QUARTERLY',
        monthlyPayment: 90,
      },
      {
        billingPeriod: 'YEARLY',
        monthlyPayment: 80,
      },
    ]
  })

  @Prop({
    type: [
      {
        billingPeriod: { type: String, enum: ['MONTHLY', 'QUATERLY','YEARLY'], required: true },
        monthlyPayment: { type: Number, required: true },
      }
    ],
    required: true,
    })
    pricing: {billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY', monthlyPayment: number}[];


  @ApiProperty({
    description: 'Plan status',
    example: true,
  })
  @Prop({ required: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Plan trial days',
    example: 30,
  })
  @Prop({ required:true })
  trialDays?: number;

  @ApiProperty({
    description: 'Plan features',
    example: ['feature1', 'feature2'],
  })
  @Prop({ type: [String], default: [] })
  features?: string[];
}

export const PlanSchema = SchemaFactory.createForClass(Plan);