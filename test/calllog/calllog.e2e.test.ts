import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import mongoose from 'mongoose';
import { AppModule } from '../../src/modules/app.module';
import { DatabaseTestHelper } from '../helpers/database.helper';
import { createMockCallLogDto } from './mock-calllog';

describe('CallLogController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbHelper: DatabaseTestHelper;
  const testUserId = 'user-123';
  const baseUrl = `/users/${testUserId}/calllogs`;

  // Test data setup
  const createTestCallLog = (overrides = {}) =>
    createMockCallLogDto({
      userId: testUserId,
      audioId: undefined, // Ensure no audioId by default
      ...overrides,
    });

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
  }, 30000);

  beforeEach(async () => {
    // Clean up before each test
    await dbHelper.cleanupAll();
  });

  afterEach(async () => {
    // Clean up after each test
    await dbHelper.cleanupAll();
  });

  afterAll(async () => {
    try {
      if (app) await app.close();
    } catch (error) {
      console.error('Error closing app:', (error as Error).message);
    }
  });

  describe('POST /users/:userId/calllogs', () => {
    it('should create a new call log with valid data', async () => {
      const testCallLog = createTestCallLog({
        callerName: 'Test User',
      });
      const response = await request(app.getHttpServer())
        .post(baseUrl)
        .send(testCallLog);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        userId: testCallLog.userId,
        callerNumber: testCallLog.callerNumber,
        callerName: testCallLog.callerName,
        serviceBookedId: testCallLog.serviceBookedId,
      });
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should fail to create call log with invalid data', async () => {
      const invalidCallLog = { userId: testUserId }; // Missing required fields
      const response = await request(app.getHttpServer())
        .post(baseUrl)
        .send(invalidCallLog);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /users/:userId/calllogs', () => {
    it('should return paginated call logs with correct structure', async () => {
      // First create some test data
      const testCallLog = createTestCallLog({
        callerName: 'Test User for GET',
      });
      await request(app.getHttpServer()).post(baseUrl).send(testCallLog);

      const response = await request(app.getHttpServer()).get(baseUrl);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const firstLog = response.body.data[0];
      expect(firstLog).toHaveProperty('_id');
      expect(firstLog).toHaveProperty('userId');
      expect(firstLog).toHaveProperty('callSid');
      expect(firstLog).toHaveProperty('startAt');
      expect(firstLog).toHaveProperty('callerNumber');
      expect(firstLog).toHaveProperty('serviceBookedId');

      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter logs by date range', async () => {
      // Create test data within the date range
      const testCallLog = createTestCallLog({
        startAt: new Date('2025-05-05T10:00:00Z'),
        callerName: 'Date Range Test User',
      });
      await request(app.getHttpServer()).post(baseUrl).send(testCallLog);

      const startAtFrom = '2025-05-01';
      const startAtTo = '2025-05-10';
      const response = await request(app.getHttpServer()).get(
        `${baseUrl}?startAtFrom=${startAtFrom}&startAtTo=${startAtTo}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((log: any) => {
        const startAt = new Date(log.startAt);
        expect(startAt >= new Date(startAtFrom)).toBe(true);
        expect(startAt <= new Date(startAtTo)).toBe(true);
      });
    });

    it('should search logs by keyword', async () => {
      // Create test data with searchable content
      const searchTerm = '6140000123';
      const testCallLog = createTestCallLog({
        callerNumber: `+${searchTerm}`,
        callerName: 'Search Test User',
      });
      await request(app.getHttpServer()).post(baseUrl).send(testCallLog);

      const response = await request(app.getHttpServer()).get(
        `${baseUrl}?search=6140000`,
      );

      expect(response.status).toBe(200);

      const hasMatchingLog = response.body.data.some(
        (log: any) =>
          log.callerNumber.replace(/[^a-zA-Z0-9]/g, '').includes('6140000') ||
          log.serviceBookedId?.includes('6140000'),
      );

      expect(hasMatchingLog).toBe(true);
    });
  });

  describe('GET /users/:userId/calllogs/:calllogId', () => {
    it('should return call log details', async () => {
      // First create a calllog
      const testCallLog = createTestCallLog({
        callerName: 'Details Test User',
      });
      const createResponse = await request(app.getHttpServer())
        .post(baseUrl)
        .send(testCallLog);
      const calllogId = createResponse.body._id;

      const response = await request(app.getHttpServer()).get(
        `${baseUrl}/${calllogId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: calllogId,
        userId: testUserId,
      });
    });

    it('should return 404 for non-existent call log', async () => {
      const response = await request(app.getHttpServer()).get(
        `${baseUrl}/non-existent-id`,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /users/:userId/calllogs/metrics/today', () => {
    it("should return today's call metrics", async () => {
      const response = await request(app.getHttpServer()).get(
        `${baseUrl}/metrics/today`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalCalls');
      expect(typeof response.body.totalCalls).toBe('number');
    });
  });

  describe('PATCH /users/:userId/calllogs/:calllogId', () => {
    it('should update call log fields', async () => {
      // First create a calllog
      const testCallLog = createTestCallLog({
        callerName: 'Original Name',
      });
      const createResponse = await request(app.getHttpServer())
        .post(baseUrl)
        .send(testCallLog);
      const calllogId = createResponse.body._id;

      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/${calllogId}`)
        .send({ callerName: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.callerName).toBe('Updated Name');
      expect(response.body._id).toBe(calllogId);
    });

    it('should return 404 for non-existent call log', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/507f1f77bcf86cd799439011`)
        .send({ callerName: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /users/:userId/calllogs/:calllogId', () => {
    it('should delete calllog and cascade delete transcript and chunks', async () => {
      // Create calllog
      const testCallLog = createTestCallLog();
      const createResponse = await request(app.getHttpServer())
        .post(baseUrl)
        .send(testCallLog);
      const calllogId = createResponse.body._id;

      // Create transcript
      await request(app.getHttpServer())
        .post(`${baseUrl}/${calllogId}/transcript`)
        .send({ summary: 'Test transcript' });

      // Create chunk
      await request(app.getHttpServer())
        .post(`${baseUrl}/${calllogId}/transcript/chunks`)
        .send({ speakerType: 'agent', text: 'Test chunk', startAt: 0 });

      // Delete calllog
      const deleteResponse = await request(app.getHttpServer()).delete(
        `${baseUrl}/${calllogId}`,
      );

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body._id).toBe(calllogId);

      // Verify calllog is deleted
      const getCalllogResponse = await request(app.getHttpServer()).get(
        `${baseUrl}/${calllogId}`,
      );
      expect(getCalllogResponse.status).toBe(404);

      // Verify transcript is deleted
      const getTranscriptResponse = await request(app.getHttpServer()).get(
        `${baseUrl}/${calllogId}/transcript`,
      );
      expect(getTranscriptResponse.status).toBe(404);

      // Verify chunks are deleted
      const getChunksResponse = await request(app.getHttpServer()).get(
        `${baseUrl}/${calllogId}/transcript/chunks`,
      );
      expect(getChunksResponse.status).toBe(404);
    });

    it('should delete calllog even when transcript does not exist', async () => {
      // Create calllog
      const testCallLog = createTestCallLog();
      const createResponse = await request(app.getHttpServer())
        .post(baseUrl)
        .send(testCallLog);
      const calllogId = createResponse.body._id;

      // Create and then delete transcript first
      await request(app.getHttpServer())
        .post(`${baseUrl}/${calllogId}/transcript`)
        .send({ summary: 'Test transcript' });
      await request(app.getHttpServer()).delete(
        `${baseUrl}/${calllogId}/transcript`,
      );

      // Then delete calllog
      const deleteResponse = await request(app.getHttpServer()).delete(
        `${baseUrl}/${calllogId}`,
      );
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body._id).toBe(calllogId);

      // Verify calllog is deleted
      const getCalllogResponse = await request(app.getHttpServer()).get(
        `${baseUrl}/${calllogId}`,
      );
      expect(getCalllogResponse.status).toBe(404);
    });

    it('should return 404 for non-existent calllog', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app.getHttpServer()).delete(
        `${baseUrl}/${nonExistentId}`,
      );
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid calllog ID', async () => {
      const response = await request(app.getHttpServer()).delete(
        `${baseUrl}/invalid-id`,
      );
      expect(response.status).toBe(400);
    });
  });
});
