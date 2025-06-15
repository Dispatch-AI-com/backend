import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';

describe('Transcript (e2e)', () => {
  let app: INestApplication;
  let calllogId: string;
  let transcriptId: string;
  const testUserId = 'test-user';
  const keyPointsExample = [
    "User Lee from Canada's warehouse needs room repair after hailstorm.",
    "Lee requests a booking for repair services.",
    "Suburb mentioned is Gungahlin, confirming service area.",
    "Sophiie offers to send a booking link for scheduling.",
    "User requests emergency assistance for a customer, advised to call emergency services."
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a CallLog', async () => {
    const res = await request(app.getHttpServer())
      .post(`/users/${testUserId}/calllogs`)
      .send({
        userId: testUserId,
        serviceBookedId: 'test-service',
        callerNumber: '1234567890',
        callerName: 'Test User',
        startAt: new Date(),
      });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    calllogId = res.body._id;
  });

  it('should create a Transcript', async () => {
    const res = await request(app.getHttpServer())
      .post(`/calllogs/${calllogId}/transcript`)
      .send({
        summary: 'Test summary',
        keyPoints: keyPointsExample
      });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.calllogId).toBe(calllogId);
    expect(res.body.summary).toBe('Test summary');
    expect(res.body.keyPoints).toEqual(keyPointsExample);
    transcriptId = res.body._id;
  });

  it('should get Transcript by calllogId', async () => {
    const res = await request(app.getHttpServer())
      .get(`/calllogs/${calllogId}/transcript`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(transcriptId);
    expect(res.body.calllogId).toBe(calllogId);
    expect(res.body.summary).toBe('Test summary');
    expect(res.body.keyPoints).toEqual(keyPointsExample);
  });

  it('should return 404 for non-existent Transcript', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
    const res = await request(app.getHttpServer())
      .get(`/calllogs/${nonExistentId}/transcript`);
    expect(res.status).toBe(404);
  });

  it('should update the Transcript', async () => {
    const updatedKeyPoints = [
      'Updated key point 1',
      'Updated key point 2'
    ];
    const res = await request(app.getHttpServer())
      .patch(`/calllogs/${calllogId}/transcript`)
      .send({ summary: 'Updated summary', keyPoints: updatedKeyPoints });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBe('Updated summary');
    expect(res.body.calllogId).toBe(calllogId);
    expect(res.body.keyPoints).toEqual(updatedKeyPoints);
  });

  it('should delete the Transcript', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/calllogs/${calllogId}/transcript`);
    expect(res.status).toBe(200);
    expect(res.body.calllogId).toBe(calllogId);
  });

  it('should return 404 after deleting the Transcript', async () => {
    const res = await request(app.getHttpServer())
      .get(`/calllogs/${calllogId}/transcript`);
    expect(res.status).toBe(404);
  });
});
