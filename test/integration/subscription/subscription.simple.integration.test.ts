import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import mongoose from 'mongoose';
import request from 'supertest';

import { AppModule } from '../../../src/modules/app.module';
import { createBasicPlan } from '../../fixtures/dynamic/plan';
import { createMockSubscriptionDto } from '../../fixtures/dynamic/subscription';
import { DatabaseTestHelper } from '../../helpers/database.helper';

// Mock Stripe service to avoid real API calls in tests
jest.mock('../../../src/modules/stripe/stripe.service', () => ({
  StripeService: jest.fn().mockImplementation(() => ({
    createCheckoutSession: jest.fn().mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    }),
    createBillingPortalSession: jest
      .fn()
      .mockResolvedValue('https://billing.stripe.com/session_123'),
    refundPayment: jest.fn().mockResolvedValue({ id: 're_123' }),
    listInvoicesByCustomerId: jest.fn().mockResolvedValue([]),
    listRefundsByChargeId: jest.fn().mockResolvedValue([]),
    client: {
      subscriptions: {
        retrieve: jest.fn().mockResolvedValue({
          id: 'sub_test_123',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'sub_test_123',
          status: 'active',
        }),
        cancel: jest.fn().mockResolvedValue({
          id: 'sub_test_123',
          status: 'canceled',
        }),
      },
      invoices: {
        retrieve: jest.fn().mockResolvedValue({
          id: 'in_test_123',
          amount_paid: 2999,
          status: 'paid',
        }),
      },
    },
  })),
}));

describe('SubscriptionController (Simple Integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbHelper: DatabaseTestHelper;
  const testUserId = '507f1f77bcf86cd799439011'; // Valid 24-char ObjectId
  const baseUrl = '/subscriptions';

  beforeAll(async () => {
    try {
      moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      dbHelper = new DatabaseTestHelper(moduleFixture);
    } catch (error) {
      console.error('Error in beforeAll:', (error as Error).message);
      throw error;
    }
  }, 60000);

  beforeEach(async () => {
    try {
      await dbHelper.cleanupAll();
    } catch (error) {
      console.error('Error in beforeEach cleanup:', (error as Error).message);
    }
  });

  afterAll(async () => {
    try {
      if (app) {
        await app.close();
      }
      if (moduleFixture) {
        await moduleFixture.close();
      }
    } catch (error) {
      console.error('Error closing app:', (error as Error).message);
    }
  }, 30000);

  it('should create a new subscription with valid data', async () => {
    // Create test user using the helper method
    const testUser = {
      _id: testUserId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullPhoneNumber: '+61123456789',
      position: 'Manager',
    };
    await dbHelper.createUser(testUser);

    // Create test plan
    const testPlan = createBasicPlan();
    const planResponse = await request(app.getHttpServer())
      .post('/plan')
      .send(testPlan)
      .timeout(5000);

    expect(planResponse.status).toBe(201);
    const planId = planResponse.body._id;

    // Create subscription
    const testSubscription = createMockSubscriptionDto({
      userId: testUserId,
      planId: planId,
    });

    const response = await request(app.getHttpServer())
      .post(baseUrl)
      .send(testSubscription)
      .timeout(10000);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('checkoutUrl');
    expect(response.body.message).toContain('Stripe checkout session created');
    expect(response.body.checkoutUrl).toMatch(
      /^https:\/\/checkout\.stripe\.com/,
    );
  }, 20000);

  it('should fail to create subscription with invalid data', async () => {
    // Create test user using the helper method
    const testUser = {
      _id: testUserId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullPhoneNumber: '+61123456789',
      position: 'Manager',
    };
    await dbHelper.createUser(testUser);

    const invalidSubscription = { userId: testUserId }; // Missing planId
    const response = await request(app.getHttpServer())
      .post(baseUrl)
      .send(invalidSubscription)
      .timeout(5000);

    expect(response.status).toBe(400);
  }, 10000);

  it('should return 404 for non-existent user subscription', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId().toString();
    const response = await request(app.getHttpServer())
      .get(`${baseUrl}/${nonExistentUserId}`)
      .timeout(5000);

    expect(response.status).toBe(404);
  }, 10000);

  it('should return 404 when creating subscription for non-existent user', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId().toString();
    const testPlan = createBasicPlan();
    const planResponse = await request(app.getHttpServer())
      .post('/plan')
      .send(testPlan)
      .timeout(5000);

    const testSubscription = createMockSubscriptionDto({
      userId: nonExistentUserId,
      planId: planResponse.body._id,
    });

    const response = await request(app.getHttpServer())
      .post(baseUrl)
      .send(testSubscription)
      .timeout(5000);

    expect(response.status).toBe(404);
  }, 10000);
});
