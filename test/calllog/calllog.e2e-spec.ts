import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';
import mongoose from 'mongoose';

interface CallLog {
  companyId: string;
  startAt: string;
  endAt?: string;
  status: string;
  [key: string]: any;
}

describe('CallLogController (e2e)', () => {
  let app: INestApplication;
  let createdCallLogId: string;
  const baseUrl = '/calllog';
  const testCompanyId = 'company-123';

  // Mock call log used for POST test
const mockCallLog = {
  companyId: testCompanyId,
  startAt: new Date('2025-05-08T10:00:00Z'),
  endAt: new Date('2025-05-08T10:10:00Z'),
  status: 'Active', 
  duration: 600,
  callerNumber: '+61400000000',
  serviceBookedId: 'booking-123', 
};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    await mongoose.connection.close(); // Cleanly close MongoDB connection
  });

  /**
   * Test: Create a new call log entry
   * Purpose: To verify that the POST /calllog API correctly stores a new call log
   */
  it('POST /calllog → should create a new call log', async () => {
    const response = await request(app.getHttpServer())
      .post(baseUrl)
      .send(mockCallLog);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.companyId).toBe(testCompanyId);
    expect(response.body.status).toBe('Active');

    createdCallLogId = response.body._id; // Store the ID for further tests
  });

  /**
   * Test: Retrieve all call logs
   * Purpose: To verify that GET /calllog returns an array of call logs
   */
  it('GET /calllog → should return all call logs', async () => {
    const response = await request(app.getHttpServer()).get(baseUrl);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('companyId');
      expect(response.body[0]).toHaveProperty('status');
    }
  });

  /**
   * Test: Retrieve call logs by companyId
   * Purpose: To verify that GET /calllog/company/:companyId filters results correctly
   */
  it('GET /calllog/company/:companyId → should return logs by company ID', async () => {
    const response = await request(app.getHttpServer()).get(
      `${baseUrl}/company/${testCompanyId}`,
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    response.body.forEach((log: CallLog) => {
      expect(log.companyId).toBe(testCompanyId);
    });
  });

  /**
   * Test: Retrieve call logs within a specific date range
   * Purpose: To verify that GET /calllog/range filters records by time
   */
  it('GET /calllog/date-range → should return logs within a date range', async () => {
    const response = await request(app.getHttpServer()).get(
      `${baseUrl}/date-range?start=2025-05-01&end=2025-05-10`,
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    // Optional: Check if returned records fall in the expected range
    response.body.forEach((log: CallLog) => {
      const startAt = new Date(log.startAt);
      expect(startAt >= new Date('2025-05-01')).toBe(true);
      expect(startAt <= new Date('2025-05-10')).toBe(true);
    });
  });

  /**
   * Test: Update an existing call log
   * Purpose: To validate the PATCH endpoint functionality
   */
  it('PATCH /calllog/:id → should update a call log status', async () => {
    const response = await request(app.getHttpServer())
      .patch(`${baseUrl}/${createdCallLogId}`)
      .send({ status: 'Inactive' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Inactive');
  });
});
