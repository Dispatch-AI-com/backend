import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../../src/modules/app.module';
import { createFreePlan, createBasicPlan, createProPlan } from '../../fixtures/dynamic/plan';
import { DatabaseTestHelper } from '../../helpers/database.helper';

describe('PlanController (Basic Integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    dbHelper = new DatabaseTestHelper(moduleFixture);
  });

  beforeEach(async () => {
    // Clean up before each test
    await dbHelper.cleanupAll();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('POST /plan', () => {
    it('should create a free plan successfully', async () => {
      const testPlan = createFreePlan({
        name: 'Unique Free Plan Test',
      });

      const response = await request(app.getHttpServer())
        .post('/plan')
        .send(testPlan);

      expect(response.status).toBe(201);
      expect(response.body.tier).toBe('FREE');
      expect(response.body.pricing[0].price).toBe(0);
      expect(response.body.features.callMinutes).toBe('60 minutes');
      expect(response.body.features.support).toBe('Community support');
    });

    it('should create a basic plan successfully', async () => {
      const testPlan = createBasicPlan({
        name: 'Unique Basic Plan Test',
      });

      const response = await request(app.getHttpServer())
        .post('/plan')
        .send(testPlan);

      expect(response.status).toBe(201);
      expect(response.body.tier).toBe('BASIC');
      expect(response.body.pricing[0].price).toBeGreaterThan(0);
      expect(response.body.features.callMinutes).toContain('minutes');
      expect(response.body.features.support).toBe('Email support');
    });

    it('should create a pro plan successfully', async () => {
      const testPlan = createProPlan({
        name: 'Unique Pro Plan Test',
      });

      const response = await request(app.getHttpServer())
        .post('/plan')
        .send(testPlan);

      expect(response.status).toBe(201);
      expect(response.body.tier).toBe('PRO');
      expect(response.body.pricing[0].price).toBeGreaterThan(0);
      expect(response.body.features.callMinutes).toContain('Unlimited');
      expect(response.body.features.support).toBe('Priority support');
    });
  });

  describe('GET /plan', () => {
    it('should return all active plans', async () => {
      const response = await request(app.getHttpServer()).get('/plan');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const firstPlan = response.body[0];
        expect(firstPlan).toHaveProperty('_id');
        expect(firstPlan).toHaveProperty('name');
        expect(firstPlan).toHaveProperty('tier');
        expect(firstPlan).toHaveProperty('pricing');
        expect(firstPlan).toHaveProperty('features');
        expect(firstPlan).toHaveProperty('isActive');
      }
    });
  });

  describe('GET /plan/:id', () => {
    it('should return plan details by id', async () => {
      // First create a plan
      const testPlan = createProPlan({
        name: 'Unique Pro Plan for Get Test',
      });
      const createResponse = await request(app.getHttpServer())
        .post('/plan')
        .send(testPlan);
      const planId = createResponse.body._id;

      const response = await request(app.getHttpServer()).get(
        `/plan/${planId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: planId,
        name: testPlan.name,
        tier: testPlan.tier,
        isActive: testPlan.isActive,
      });
    });
  });

  describe('PUT /plan/:id', () => {
    it('should fully update a plan', async () => {
      // First create a plan
      const testPlan = createBasicPlan({
        name: 'Unique Basic Plan for Update Test',
      });
      const createResponse = await request(app.getHttpServer())
        .post('/plan')
        .send(testPlan);
      const planId = createResponse.body._id;

      const updateData = {
        name: 'Updated Plan Name',
        tier: 'PRO' as const,
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
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .put(`/plan/${planId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: planId,
        name: updateData.name,
        tier: updateData.tier,
        isActive: updateData.isActive,
      });
    });
  });

  describe('PATCH /plan/:id', () => {
    it('should partially update plan name', async () => {
      // First create a plan
      const testPlan = createBasicPlan({
        name: 'Unique Basic Plan for Patch Test',
      });
      const createResponse = await request(app.getHttpServer())
        .post('/plan')
        .send(testPlan);
      const planId = createResponse.body._id;

      const partialUpdate = { name: 'Patched Name' };

      const response = await request(app.getHttpServer())
        .patch(`/plan/${planId}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Patched Name');
      expect(response.body.tier).toBe('BASIC'); // Should remain unchanged
    });
  });

  describe('DELETE /plan/:id', () => {
    it('should delete a plan successfully', async () => {
      // First create a plan
      const testPlan = createBasicPlan({
        name: 'Unique Basic Plan for Delete Test',
      });
      const createResponse = await request(app.getHttpServer())
        .post('/plan')
        .send(testPlan);
      const planId = createResponse.body._id;

      const response = await request(app.getHttpServer()).delete(
        `/plan/${planId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: 'Plan deleted successfully',
      });

      // Verify plan is actually deleted
      const getResponse = await request(app.getHttpServer()).get(
        `/plan/${planId}`,
      );
      expect(getResponse.status).toBe(404);
    });
  });
});
