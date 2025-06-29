import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OnboardingSessionDocument = OnboardingSession & Document;

@Schema({ timestamps: true })
export class OnboardingSession {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ required: true, default: 1 })
  currentStep!: number;

  @Prop({ type: Object, default: {} })
  answers!: Record<string, string>;

  @Prop({ enum: ['in_progress', 'completed'], default: 'in_progress' })
  status!: string;
}

export const OnboardingSessionSchema =
  SchemaFactory.createForClass(OnboardingSession);
