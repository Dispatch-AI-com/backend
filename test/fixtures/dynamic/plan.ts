// ============================================================================
// Dynamic Plan Test Data Generators - Creates fresh test data for each test
// ============================================================================

import type { CreatePlanDto } from '../../../src/modules/plan/dto/create-plan.dto';
import type { UpdatePlanDto } from '../../../src/modules/plan/dto/update-plan.dto';
import type { Plan } from '../../../src/modules/plan/schema/plan.schema';

export function createMockPlanDto(overrides: Partial<CreatePlanDto> = {}): CreatePlanDto {
  return {
    name: 'Test Plan',
    tier: 'BASIC',
    pricing: [
      {
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        price: 29,
        stripePriceId: 'price_test_monthly',
      },
    ],
    features: {
      callMinutes: '300 minutes',
      support: 'Standard support',
    },
    isActive: true,
    ...overrides,
  };
}

export function createMockPlanDtos(count: number, overrides: Partial<CreatePlanDto> = {}): CreatePlanDto[] {
  return Array.from({ length: count }, (_, index) =>
    createMockPlanDto({
      name: `Test Plan ${index + 1}`,
      ...overrides,
    })
  );
}

export function createMockUpdatePlanDto(overrides: Partial<UpdatePlanDto> = {}): UpdatePlanDto {
  return {
    name: 'Updated Test Plan',
    tier: 'PRO',
    pricing: [
      {
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        price: 99,
        stripePriceId: 'price_updated_monthly',
      },
    ],
    features: {
      callMinutes: 'Unlimited',
      support: 'Premium support',
    },
    isActive: true,
    ...overrides,
  };
}

export function createMockPlan(overrides: Partial<Plan> = {}): Plan {
  return {
    _id: 'plan-test-123',
    name: 'Test Plan',
    tier: 'BASIC',
    pricing: [
      {
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        price: 29,
        stripePriceId: 'price_test_monthly',
      },
    ],
    features: {
      callMinutes: '300 minutes',
      support: 'Standard support',
    },
    isActive: true,
    ...overrides,
  } as Plan;
}

export function createMockPlans(count: number, overrides: Partial<Plan> = {}): Plan[] {
  return Array.from({ length: count }, (_, index) =>
    createMockPlan({
      _id: `plan-test-${index + 1}`,
      name: `Test Plan ${index + 1}`,
      ...overrides,
    })
  );
}