// ============================================================================
// Static Plan Test Data - Immutable test fixtures
// ============================================================================

import type { Plan } from '../../../src/modules/plan/schema/plan.schema';

export const staticPlan: Plan = {
  _id: 'plan-123',
  name: 'Free Plan',
  tier: 'FREE',
  pricing: [
    {
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      price: 0,
      stripePriceId: 'price_free_monthly',
    },
  ],
  features: {
    callMinutes: '100 minutes',
    support: 'Email support',
  },
  isActive: true,
} as Plan;

export const staticBasicPlan: Plan = {
  _id: 'plan-456',
  name: 'Basic Plan',
  tier: 'BASIC',
  pricing: [
    {
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      price: 29,
      stripePriceId: 'price_basic_monthly',
    },
    {
      rrule: 'FREQ=YEARLY;INTERVAL=1',
      price: 290,
      stripePriceId: 'price_basic_yearly',
    },
  ],
  features: {
    callMinutes: '500 minutes',
    support: 'Priority support',
  },
  isActive: true,
} as Plan;

export const staticProPlan: Plan = {
  _id: 'plan-789',
  name: 'Pro Plan',
  tier: 'PRO',
  pricing: [
    {
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      price: 99,
      stripePriceId: 'price_pro_monthly',
    },
    {
      rrule: 'FREQ=YEARLY;INTERVAL=1',
      price: 990,
      stripePriceId: 'price_pro_yearly',
    },
  ],
  features: {
    callMinutes: 'Unlimited',
    support: '24/7 phone support',
  },
  isActive: true,
} as Plan;

export const staticInactivePlan: Plan = {
  _id: 'plan-999',
  name: 'Legacy Plan',
  tier: 'BASIC',
  pricing: [
    {
      rrule: 'FREQ=MONTHLY;INTERVAL=1',
      price: 19,
      stripePriceId: 'price_legacy_monthly',
    },
  ],
  features: {
    callMinutes: '200 minutes',
    support: 'Basic support',
  },
  isActive: false,
} as Plan;