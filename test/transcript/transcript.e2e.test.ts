import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';

describe('Transcript (e2e)', () => {
  let app: INestApplication;
  let calllogId: string;
  let transcriptId: string;

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
      .post('/calllog')
      .send({
        companyId: 'test-company',
        serviceBookedId: 'test-service',
        callerNumber: '1234567890',
        startAt: new Date(),
      });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    calllogId = res.body._id;
  });

  it('should create a Transcript', async () => {
    const res = await request(app.getHttpServer())
      .post('/transcript')
      .send({
        calllogid: calllogId,
        summary: 'Test summary',
      });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    transcriptId = res.body._id;
  });

  it('should get all Transcripts', async () => {
    const res = await request(app.getHttpServer())
      .get('/transcript');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]._id).toBeDefined();
    expect(res.body[0].calllogid).toBeDefined();
    expect(res.body[0].summary).toBeDefined();
  });

  it('should get the created Transcript by calllogId', async () => {
    const res = await request(app.getHttpServer())
      .get(`/transcript/calllog/${calllogId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]._id).toBe(transcriptId);
    expect(res.body[0].calllogid).toBe(calllogId);
  });

  it('should update the Transcript', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/transcript/${transcriptId}`)
      .send({ summary: 'Updated summary' });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBe('Updated summary');
    expect(res.body._id).toBe(transcriptId);
  });

  it('should delete the Transcript', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/transcript/${transcriptId}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(transcriptId);
  });

  it('should return empty array after deleting the Transcript', async () => {
    const res = await request(app.getHttpServer())
      .get(`/transcript/calllog/${calllogId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
