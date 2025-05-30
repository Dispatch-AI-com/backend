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
  const testCompanyId = 'company-123';
  const baseUrl = `/companies/${testCompanyId}/calllogs`;

  // Test data setup
  const createTestCallLog = (overrides = {}) => createMockCallLogDto({
    companyId: testCompanyId,
    audioId: undefined, // Ensure no audioId by default
    ...overrides
  });

  const mockCallLogs = [
    createTestCallLog({
      callerNumber: '+61400001234',
      serviceBookedId: 'booking-123',
    }),
    createTestCallLog({
      startAt: new Date('2025-05-09T11:00:00Z'),
      endAt: new Date('2025-05-09T11:15:00Z'),
      callerNumber: '+61400005678',
      serviceBookedId: 'booking-124',
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

  describe('POST /companies/:companyId/calllogs', () => {
    it('should create a new call log with valid data', async () => {
      const testCallLog = createTestCallLog();
      const response = await request(app.getHttpServer())
        .post(baseUrl)
        .send(testCallLog);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        companyId: testCallLog.companyId,
        status: testCallLog.status,
        callerNumber: testCallLog.callerNumber,
        serviceBookedId: testCallLog.serviceBookedId,
      });
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      createdCallLogId = response.body._id;
    });

    it('should fail to create call log with invalid data', async () => {
      const invalidCallLog = { companyId: testCompanyId }; // Missing required fields
      const response = await request(app.getHttpServer())
        .post(baseUrl)
        .send(invalidCallLog);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /companies/:companyId/calllogs', () => {
    it('should return paginated call logs with correct structure', async () => {
      const response = await request(app.getHttpServer()).get(baseUrl);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const firstLog = response.body.data[0];
      expect(firstLog).toHaveProperty('_id');
      expect(firstLog).toHaveProperty('companyId');
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
        .get(`${baseUrl}?status=${CallLogStatus.Completed}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((log: ICallLog) => {
        expect(log.status).toBe(CallLogStatus.Completed);
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
      // Use a simpler search term that matches the pattern in our test data
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

  describe('GET /companies/:companyId/calllogs/:calllogId', () => {
    it('should return call log details', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/${createdCallLogId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: createdCallLogId,
        companyId: testCompanyId,
      });
    });

    it('should return 404 for non-existent call log', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/non-existent-id`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /companies/:companyId/calllogs/metrics/today', () => {
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

  describe('PATCH /companies/:companyId/calllogs/:calllogId', () => {
    it('should update call log status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/${createdCallLogId}`)
        .send({ status: CallLogStatus.Missed });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(CallLogStatus.Missed);
      expect(response.body._id).toBe(createdCallLogId);
    });

    it('should return 404 for non-existent call log', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/non-existent-id`)
        .send({ status: CallLogStatus.Missed });

      expect(response.status).toBe(404);
    });

    it('should validate status enum values', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/${createdCallLogId}`)
        .send({ status: 'InvalidStatus' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /companies/:companyId/calllogs/:calllogId/audio', () => {
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
});
