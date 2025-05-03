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
