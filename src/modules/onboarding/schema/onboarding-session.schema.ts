import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OnboardingSessionDocument = OnboardingSession & Document;

export interface AddressAnswers {
  unitAptPOBox?: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
}

export interface CompanyAnswers {
  businessName: string;
  abn: string;
  number: string;
  email: string;
  address: AddressAnswers;
}

export interface UserAnswers {
  phone?: string;
  position?: string;
}

export interface OnboardingAnswers {
  company?: CompanyAnswers;
  user?: UserAnswers;
}

@Schema({ timestamps: true })
export class OnboardingSession {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ required: true, default: 1 })
  currentStep!: number;

  @Prop({ type: Object, default: {} })
  answers!: OnboardingAnswers;

  @Prop({ enum: ['in_progress', 'completed'], default: 'in_progress' })
  status!: string;
}

export const OnboardingSessionSchema =
  SchemaFactory.createForClass(OnboardingSession);
