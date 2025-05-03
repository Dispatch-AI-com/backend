import { IResponseBase } from '@/common/interfaces/res.d';

export interface IPriceOption {
  billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  monthlyPayment: number;
}
export interface IPlan {
  name: string;
  description: string;
  tier: string;
  isActive: boolean;
  trialDays?: number;
  features?: string[];
  pricing: IPriceOption[];
}

export interface IPlanResponse extends IResponseBase {
  data: IPlan;
}
