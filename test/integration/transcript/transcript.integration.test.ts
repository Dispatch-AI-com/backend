import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/modules/app.module';
import { DatabaseTestHelper } from '../../helpers/database.helper';

describe('Transcript (integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbHelper: DatabaseTestHelper;
  const testUserId = 'test-user';
  const keyPointsExample = [
    "User Lee from Canada's warehouse needs room repair after hailstorm.",
    'Lee requests a booking for repair services.',
    'Suburb mentioned is Gungahlin, confirming service area.',
    'Sophiie offers to send a booking link for scheduling.',
    'User requests emergency assistance for a customer, advised to call emergency services.',
  ];

  beforeAll(async () => {
    try {
      moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
      );
      await app.init();

      dbHelper = new DatabaseTestHelper(moduleFixture);
    } catch (error) {
      console.error('Error in beforeAll:', (error as Error).message);
      throw error;
    }
  }, 30000);

  beforeEach(async () => {
    // Clean up and seed basic data for each test
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

  it('should create a CallLog', async () => {
    const callSid = 'CA' + require('crypto').randomBytes(16).toString('hex');
    const res = await request(app.getHttpServer())
      .post(`/users/${testUserId}/calllogs`)
      .send({
        callSid,
        userId: testUserId,
        serviceBookedId: 'test-service',
        callerNumber: '1234567890',
        callerName: 'Test User',
        startAt: new Date(),
      });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.callSid).toBe(callSid);
    expect(res.body.userId).toBe(testUserId);
  });

  it('should create a Transcript', async () => {
    // First create a calllog
    const callSid = 'CA' + require('crypto').randomBytes(16).toString('hex');
    const callLogRes = await request(app.getHttpServer())
      .post(`/users/${testUserId}/calllogs`)
      .send({
        callSid,
        userId: testUserId,
        serviceBookedId: 'test-service',
        callerNumber: '1234567890',
        callerName: 'Test User',
        startAt: new Date(),
      });
    const calllogId = callLogRes.body._id;

    const res = await request(app.getHttpServer())
      .post(`/calllogs/${calllogId}/transcript`)
      .send({
        summary: 'Test summary',
        keyPoints: keyPointsExample,
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.callSid).toBe(callSid);
    expect(res.body.summary).toBe('Test summary');
    expect(res.body.keyPoints).toEqual(keyPointsExample);
  });

  it('should get Transcript by callSid', async () => {
    // First create calllog and transcript
    const callSid = 'CA' + require('crypto').randomBytes(16).toString('hex');
    const callLogRes = await request(app.getHttpServer())
      .post(`/users/${testUserId}/calllogs`)
      .send({
        callSid,
        userId: testUserId,
        serviceBookedId: 'test-service',
        callerNumber: '1234567890',
        callerName: 'Test User',
        startAt: new Date(),
      });
    const calllogId = callLogRes.body._id;

    await request(app.getHttpServer())
      .post(`/calllogs/${calllogId}/transcript`)
      .send({
        summary: 'Test summary for transcript',
        keyPoints: keyPointsExample,
      });

    const res = await request(app.getHttpServer()).get(
      `/calllogs/${calllogId}/transcript`,
    );
    expect(res.status).toBe(200);
    expect(res.body._id).toBeDefined();
    expect(res.body.callSid).toBe(callSid);
    expect(res.body.summary).toBe('Test summary for transcript');
  });

  it('should return 404 for non-existent Transcript', async () => {
    const nonExistentId = '507f1f77bcf86cd799439999';
    const res = await request(app.getHttpServer()).get(
      `/calllogs/${nonExistentId}/transcript`,
    );
    expect(res.status).toBe(404);
  });

  it('should update the Transcript', async () => {
    // First create calllog and transcript
    const callSid = 'CA' + require('crypto').randomBytes(16).toString('hex');
    const callLogRes = await request(app.getHttpServer())
      .post(`/users/${testUserId}/calllogs`)
      .send({
        callSid,
        userId: testUserId,
        serviceBookedId: 'test-service',
        callerNumber: '1234567890',
        callerName: 'Test User',
        startAt: new Date(),
      });
    const calllogId = callLogRes.body._id;

    await request(app.getHttpServer())
      .post(`/calllogs/${calllogId}/transcript`)
      .send({
        summary: 'Original summary',
        keyPoints: keyPointsExample,
      });

    const updatedKeyPoints = ['Updated key point 1', 'Updated key point 2'];

    const res = await request(app.getHttpServer())
      .patch(`/calllogs/${calllogId}/transcript`)
      .send({ summary: 'Updated summary', keyPoints: updatedKeyPoints });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBe('Updated summary');
    expect(res.body.callSid).toBe(callSid);
    expect(res.body.keyPoints).toEqual(updatedKeyPoints);
  });

  it('should delete the Transcript', async () => {
    // First create calllog and transcript
    const callSid = 'CA' + require('crypto').randomBytes(16).toString('hex');
    const callLogRes = await request(app.getHttpServer())
      .post(`/users/${testUserId}/calllogs`)
      .send({
        callSid,
        userId: testUserId,
        serviceBookedId: 'test-service',
        callerNumber: '1234567890',
        callerName: 'Test User',
        startAt: new Date(),
      });
    const calllogId = callLogRes.body._id;

    await request(app.getHttpServer())
      .post(`/calllogs/${calllogId}/transcript`)
      .send({
        summary: 'Test summary',
        keyPoints: keyPointsExample,
      });

    const res = await request(app.getHttpServer()).delete(
      `/calllogs/${calllogId}/transcript`,
    );
    expect(res.status).toBe(200);
    expect(res.body.callSid).toBe(callSid);
  });

  it('should return 404 after deleting the Transcript', async () => {
    // This test is independent - no transcript exists
    const nonExistentId = '507f1f77bcf86cd799439998';

    const res = await request(app.getHttpServer()).get(
      `/calllogs/${nonExistentId}/transcript`,
    );
    expect(res.status).toBe(404);
  });
});
