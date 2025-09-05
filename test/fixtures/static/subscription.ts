// ============================================================================
// Static Subscription Test Data - Immutable test fixtures
// ============================================================================

import { Types } from 'mongoose';

import type { Subscription } from '../../../src/modules/subscription/schema/subscription.schema';

export const staticSubscription: Subscription = {
  _id: 'subscription-123',
  userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
  planId: new Types.ObjectId('507f1f77bcf86cd799439012'),
  subscriptionId: 'sub_1234567890',
  stripeCustomerId: 'cus_1234567890',
  chargeId: 'ch_1234567890',
  status: 'active',
  startAt: new Date('2023-01-01T00:00:00.000Z'),
  endAt: new Date('2024-01-01T00:00:00.000Z'),
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  updatedAt: new Date('2023-01-01T00:00:00.000Z'),
} as Subscription;

export const staticActiveSubscription: Subscription = {
  _id: 'subscription-456',
  userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
  planId: new Types.ObjectId('507f1f77bcf86cd799439013'),
  subscriptionId: 'sub_active_123',
  stripeCustomerId: 'cus_active_123',
  chargeId: 'ch_active_123',
  status: 'active',
  startAt: new Date('2023-06-01T00:00:00.000Z'),
  endAt: new Date('2024-06-01T00:00:00.000Z'),
  createdAt: new Date('2023-06-01T00:00:00.000Z'),
  updatedAt: new Date('2023-06-01T00:00:00.000Z'),
} as Subscription;

export const staticFailedSubscription: Subscription = {
  _id: 'subscription-789',
  userId: new Types.ObjectId('507f1f77bcf86cd799439014'),
  planId: new Types.ObjectId('507f1f77bcf86cd799439012'),
  subscriptionId: 'sub_failed_123',
  stripeCustomerId: 'cus_failed_123',
  chargeId: 'ch_failed_123',
  status: 'failed',
  startAt: new Date('2023-03-01T00:00:00.000Z'),
  endAt: new Date('2023-04-01T00:00:00.000Z'),
  createdAt: new Date('2023-03-01T00:00:00.000Z'),
  updatedAt: new Date('2023-03-01T00:00:00.000Z'),
} as Subscription;

export const staticCancelledSubscription: Subscription = {
  _id: 'subscription-999',
  userId: new Types.ObjectId('507f1f77bcf86cd799439015'),
  planId: new Types.ObjectId('507f1f77bcf86cd799439012'),
  subscriptionId: 'sub_cancelled_123',
  stripeCustomerId: 'cus_cancelled_123',
  chargeId: 'ch_cancelled_123',
  status: 'cancelled',
  startAt: new Date('2023-02-01T00:00:00.000Z'),
  endAt: new Date('2023-03-01T00:00:00.000Z'),
  createdAt: new Date('2023-02-01T00:00:00.000Z'),
  updatedAt: new Date('2023-02-01T00:00:00.000Z'),
} as Subscription;
