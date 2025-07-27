import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';
import mongoose from 'mongoose';
import { ICallLog } from '../../src/common/interfaces/calllog';
import { CallLogStatus } from '../../src/common/constants/calllog.constant';
import { createMockCallLogDto } from './mock-calllog';

// Suppress punycode deprecation warning
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return;
  }
  console.warn(warning);
});

describe('CallLogController (e2e)', () => {
  let app: INestApplication;
  let createdCallLogId: string;
  const testUserId = 'user-123';
  const baseUrl = `/users/${testUserId}/calllogs`;

  // Test data setup
  const createTestCallLog = (overrides = {}) => createMockCallLogDto({
    userId: testUserId,
    audioId: undefined, // Ensure no audioId by default
    ...overrides
  });

  const mockCallLogs = [
    createTestCallLog({
      callerNumber: '+61400001234',
      serviceBookedId: 'booking-123',
      callerName: 'John Doe',
    }),
    createTestCallLog({
      startAt: new Date('2025-05-09T11:00:00Z'),
      endAt: new Date('2025-05-09T11:15:00Z'),
      callerNumber: '+61400005678',
      serviceBookedId: 'booking-124',
      callerName: 'Jane Smith',
    }),
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test data
    for (const mockCallLog of mockCallLogs) {
      const response = await request(app.getHttpServer())
        .post(baseUrl)
        .send(mockCallLog);
      
      if (response.status !== 201) {
        console.error('Failed to create test data:', response.body);
      }
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    await mongoose.connection.close();
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
        status: testCallLog.status,
        callerNumber: testCallLog.callerNumber,
        callerName: testCallLog.callerName,
        serviceBookedId: testCallLog.serviceBookedId,
      });
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      createdCallLogId = response.body._id;
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
      const response = await request(app.getHttpServer()).get(baseUrl);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const firstLog = response.body.data[0];
      expect(firstLog).toHaveProperty('_id');
      expect(firstLog).toHaveProperty('userId');
      expect(firstLog).toHaveProperty('status');
      expect(firstLog).toHaveProperty('startAt');
      expect(firstLog).toHaveProperty('callerNumber');
      expect(firstLog).toHaveProperty('serviceBookedId');

      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter logs by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}?status=${CallLogStatus.Done}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((log: ICallLog) => {
        expect(log.status).toBe(CallLogStatus.Done);
      });
    });

    it('should filter logs by date range', async () => {
      const startAtFrom = '2025-05-01';
      const startAtTo = '2025-05-10';
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}?startAtFrom=${startAtFrom}&startAtTo=${startAtTo}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((log: ICallLog) => {
        const startAt = new Date(log.startAt);
        expect(startAt >= new Date(startAtFrom)).toBe(true);
        expect(startAt <= new Date(startAtTo)).toBe(true);
      });
    });

    it('should search logs by keyword', async () => {
      const searchTerm = '6140000';
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}?search=${searchTerm}`);

      expect(response.status).toBe(200);
      
      const hasMatchingLog = response.body.data.some((log: ICallLog) => 
        log.callerNumber.replace(/[^a-zA-Z0-9]/g, '').includes(searchTerm) || 
        (log.serviceBookedId && log.serviceBookedId.includes(searchTerm))
      );
      
      expect(hasMatchingLog).toBe(true);
    });
  });

  describe('GET /users/:userId/calllogs/:calllogId', () => {
    it('should return call log details', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/${createdCallLogId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: createdCallLogId,
        userId: testUserId,
      });
    });

    it('should return 404 for non-existent call log', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/non-existent-id`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /users/:userId/calllogs/metrics/today', () => {
    it('should return today\'s call metrics', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/metrics/today`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalCalls');
      expect(response.body).toHaveProperty('liveCalls');
      expect(typeof response.body.totalCalls).toBe('number');
      expect(typeof response.body.liveCalls).toBe('number');
    });
  });

  describe('PATCH /users/:userId/calllogs/:calllogId', () => {
    it('should update call log status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/${createdCallLogId}`)
        .send({ status: CallLogStatus.Cancelled });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(CallLogStatus.Cancelled);
      expect(response.body._id).toBe(createdCallLogId);
    });

    it('should return 404 for non-existent call log', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/non-existent-id`)
        .send({ status: CallLogStatus.Cancelled });

      expect(response.status).toBe(404);
    });

    it('should validate status enum values', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/${createdCallLogId}`)
        .send({ status: 'InvalidStatus' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /users/:userId/calllogs/:calllogId/audio', () => {
    it('should return 404 when audio is not available', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/${createdCallLogId}/audio`);

      expect(response.status).toBe(404);
    });

    it('should return audio ID when available', async () => {
      // First update the call log to have an audioId
      const audioId = 'test-audio-123';
      await request(app.getHttpServer())
        .patch(`${baseUrl}/${createdCallLogId}`)
        .send({ audioId });

      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/${createdCallLogId}/audio`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ audioId });
    });
  });

  describe('DELETE /users/:userId/calllogs/:calllogId', () => {
    let calllogId: string;
    let transcriptId: string;

    beforeEach(async () => {
      // Create calllog
      const testCallLog = createTestCallLog();
      const createResponse = await request(app.getHttpServer())
        .post(baseUrl)
        .send(testCallLog);
      calllogId = createResponse.body._id;
      
      console.log('Created calllog:', {
        _id: createResponse.body._id,
        userId: createResponse.body.userId,
        expectedUserId: testUserId
      });

      // Verify calllog is present
      const getResponse = await request(app.getHttpServer())
        .get(`${baseUrl}/${calllogId}`);
      console.log('GET after create status:', getResponse.status);
      console.log('GET after create body:', getResponse.body);

      // Create transcript
      const transcriptResponse = await request(app.getHttpServer())
        .post(`${baseUrl}/${calllogId}/transcript`)
        .send({ summary: 'Test transcript' });
      transcriptId = transcriptResponse.body._id;

      // Create chunk
      await request(app.getHttpServer())
        .post(`${baseUrl}/${calllogId}/transcript/chunks`)
        .send({ speakerType: 'agent', text: 'Test chunk', startAt: 0 });
    });

    afterEach(async () => {
      // Clean up to prevent test interference
      try {
        await request(app.getHttpServer()).delete(`${baseUrl}/${calllogId}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should delete calllog and cascade delete transcript and chunks', async () => {
      console.log('Test calllogId:', calllogId);
      console.log('Test userId:', testUserId);
      
      // Delete calllog
      const deleteResponse = await request(app.getHttpServer())
        .delete(`${baseUrl}/${calllogId}`);
      
      console.log('Delete response status:', deleteResponse.status);
      console.log('Delete response body:', deleteResponse.body);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body._id).toBe(calllogId);

      // Verify calllog is deleted
      const getCalllogResponse = await request(app.getHttpServer())
        .get(`${baseUrl}/${calllogId}`);
      expect(getCalllogResponse.status).toBe(404);

      // Verify transcript is deleted
      const getTranscriptResponse = await request(app.getHttpServer())
        .get(`${baseUrl}/${calllogId}/transcript`);
      expect(getTranscriptResponse.status).toBe(404);

      // Verify chunks are deleted
      const getChunksResponse = await request(app.getHttpServer())
        .get(`${baseUrl}/${calllogId}/transcript/chunks`);
      expect(getChunksResponse.status).toBe(404);
    });

    it('should delete calllog even when transcript does not exist', async () => {
      // Delete transcript first
      await request(app.getHttpServer())
        .delete(`${baseUrl}/${calllogId}/transcript`);

      // Then delete calllog
      const deleteResponse = await request(app.getHttpServer())
        .delete(`${baseUrl}/${calllogId}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body._id).toBe(calllogId);

      // Verify calllog is deleted
      const getCalllogResponse = await request(app.getHttpServer())
        .get(`${baseUrl}/${calllogId}`);
      expect(getCalllogResponse.status).toBe(404);
    });

    it('should return 404 for non-existent calllog', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app.getHttpServer())
        .delete(`${baseUrl}/${nonExistentId}`);
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid calllog ID', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${baseUrl}/invalid-id`);
      expect(response.status).toBe(400);
    });
  });
});
