import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';
import mongoose from 'mongoose';
import { ICallLog } from '../../src/common/interfaces/calllog';
import { CallLogStatus } from '../../src/common/constants/calllog.constant';

describe('CallLogController (e2e)', () => {
  let app: INestApplication;
  let createdCallLogId: string;
  const baseUrl = '/calllog';
  const testCompanyId = 'company-123';

  // Test data setup
  const createTestCallLog = (overrides = {}) => ({
    companyId: testCompanyId,
    startAt: new Date('2025-05-08T10:00:00Z'),
    endAt: new Date('2025-05-08T10:10:00Z'),
    status: CallLogStatus.Active,
    duration: 600,
    callerNumber: '+61400000000',
    serviceBookedId: 'booking-123',
    ...overrides,
  });

  const mockCallLogs = [
    createTestCallLog(),
    createTestCallLog({
      startAt: new Date('2025-05-09T11:00:00Z'),
      endAt: new Date('2025-05-09T11:15:00Z'),
      duration: 900,
      callerNumber: '+61400000001',
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
      await request(app.getHttpServer())
        .post(baseUrl)
        .send(mockCallLog);
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    await mongoose.connection.close();
  });

  describe('POST /calllog', () => {
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

  describe('GET /calllog', () => {
    it('should return all call logs with correct structure', async () => {
      const response = await request(app.getHttpServer()).get(baseUrl);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const firstLog = response.body[0];
      expect(firstLog).toHaveProperty('_id');
      expect(firstLog).toHaveProperty('companyId');
      expect(firstLog).toHaveProperty('status');
      expect(firstLog).toHaveProperty('startAt');
      expect(firstLog).toHaveProperty('callerNumber');
      expect(firstLog).toHaveProperty('serviceBookedId');
    });

    it('should return logs sorted by startAt in descending order', async () => {
      const response = await request(app.getHttpServer()).get(baseUrl);
      
      expect(response.status).toBe(200);
      const logs = response.body;
      
      for (let i = 0; i < logs.length - 1; i++) {
        const currentDate = new Date(logs[i].startAt);
        const nextDate = new Date(logs[i + 1].startAt);
        expect(currentDate >= nextDate).toBe(true);
      }
    });
  });

  describe('GET /calllog/company/:companyId', () => {
    it('should return logs for specific company', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/company/${testCompanyId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      response.body.forEach((log: ICallLog) => {
        expect(log.companyId).toBe(testCompanyId);
        expect(log).toHaveProperty('_id');
        expect(log).toHaveProperty('status');
        expect(log).toHaveProperty('startAt');
      });
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/company/non-existent-company`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /calllog/date-range', () => {
    it('should return logs within date range', async () => {
      const startDate = '2025-05-01';
      const endDate = '2025-05-10';
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/date-range?startDate=${startDate}&endDate=${endDate}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      response.body.forEach((log: ICallLog) => {
        const startAt = new Date(log.startAt);
        expect(startAt >= new Date(startDate)).toBe(true);
        expect(startAt <= new Date(endDate)).toBe(true);
      });
    });

    it('should handle invalid date parameters', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/date-range?startDate=invalid&endDate=invalid`);

      expect(response.status).toBe(400);
    });

    it('should handle missing date parameters', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/date-range`);

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /calllog/:id', () => {
    it('should update call log status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/${createdCallLogId}`)
        .send({ status: CallLogStatus.Inactive });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(CallLogStatus.Inactive);
      expect(response.body._id).toBe(createdCallLogId);
    });

    it('should return 404 for non-existent call log', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/non-existent-id`)
        .send({ status: CallLogStatus.Inactive });

      expect(response.status).toBe(404);
    });

    it('should validate status enum values', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${baseUrl}/${createdCallLogId}`)
        .send({ status: 'InvalidStatus' });

      expect(response.status).toBe(400);
    });
  });
});
