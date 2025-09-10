// ============================================================================
// Dynamic Subscription Test Data Generators - Creates fresh test data for each test
// ============================================================================

import { Types } from 'mongoose';
import { generateRandomNumber, randomString } from './common';

import type { CreateSubscriptionDto } from '../../../src/modules/subscription/dto/create-subscription.dto';
import type { Subscription } from '../../../src/modules/subscription/schema/subscription.schema';

// ============================================================================
// Subscription Status Types
// ============================================================================

export const SUBSCRIPTION_STATUSES = ['active', 'failed', 'cancelled'] as const;
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number];

// ============================================================================
// Dynamic Data Generators
// ============================================================================

/**
 * Generate a random subscription ID
 */
function generateSubscriptionId(): string {
  return `sub_${randomString(16)}`;
}

/**
 * Generate a random Stripe customer ID
 */
function generateStripeCustomerId(): string {
  return `cus_${randomString(16)}`;
}

/**
 * Generate a random charge ID
 */
function generateChargeId(): string {
  return `ch_${randomString(16)}`;
}

/**
 * Generate random dates for subscription period
 */
function generateSubscriptionDates(): { startAt: Date; endAt: Date } {
  const startAt = new Date(Date.now() - generateRandomNumber(365 * 24 * 60 * 60 * 1000));
  const endAt = new Date(startAt.getTime() + (365 * 24 * 60 * 60 * 1000));
  return { startAt, endAt };
}

// ============================================================================
// Main Factory Functions
// ============================================================================

/**
 * Create a mock subscription DTO with realistic data
 */
export function createMockSubscriptionDto(overrides: Partial<CreateSubscriptionDto> = {}): CreateSubscriptionDto {
  return {
    userId: overrides.userId || new Types.ObjectId().toString(),
    planId: overrides.planId || new Types.ObjectId().toString(),
    ...overrides,
  };
}

/**
 * Create a mock subscription entity with realistic data
 */
export function createMockSubscription(overrides: Partial<Subscription> = {}): Subscription {
  const { startAt, endAt } = generateSubscriptionDates();
  
  return {
    userId: overrides.userId || new Types.ObjectId(),
    planId: overrides.planId || new Types.ObjectId(),
    subscriptionId: overrides.subscriptionId || generateSubscriptionId(),
    stripeCustomerId: overrides.stripeCustomerId || generateStripeCustomerId(),
    chargeId: overrides.chargeId || generateChargeId(),
    status: overrides.status || SUBSCRIPTION_STATUSES[generateRandomNumber(SUBSCRIPTION_STATUSES.length)],
    startAt: overrides.startAt || startAt,
    endAt: overrides.endAt || endAt,
    createdAt: overrides.createdAt || startAt,
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides,
  } as Subscription;
}

/**
 * Create multiple mock subscription entities with variety
 */
export function createMockSubscriptions(count: number, overrides: Partial<Subscription> = {}): Subscription[] {
  return Array.from({ length: count }, (_, index) => {
    return createMockSubscription({
      ...overrides,
      userId: overrides.userId || new Types.ObjectId(),
      planId: overrides.planId || new Types.ObjectId(),
    });
  });
}

// ============================================================================
// Specialized Subscription Generators
// ============================================================================

/**
 * Create an active subscription
 */
export function createActiveSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return createMockSubscription({
    status: 'active',
    ...overrides,
  });
}

/**
 * Create a failed subscription
 */
export function createFailedSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return createMockSubscription({
    status: 'failed',
    ...overrides,
  });
}

/**
 * Create a cancelled subscription
 */
export function createCancelledSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return createMockSubscription({
    status: 'cancelled',
    ...overrides,
  });
}
