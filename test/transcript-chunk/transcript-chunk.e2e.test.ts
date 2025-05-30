import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';

describe('TranscriptChunk (e2e)', () => {
  let app: INestApplication;
  let calllogId: string;
  let transcriptId: string;
  let chunkId: string;
  const testCompanyId = 'test-company';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    const calllogRes = await request(app.getHttpServer())
      .post(`/companies/${testCompanyId}/calllogs`)
      .send({
        companyId: testCompanyId,
        serviceBookedId: 'test-service',
        callerNumber: '1234567890',
        startAt: new Date(),
      });
    calllogId = calllogRes.body._id;

    const transcriptRes = await request(app.getHttpServer())
      .post(`/companies/${testCompanyId}/calllogs/${calllogId}/transcript`)
      .send({
        summary: 'Test summary',
      });
    transcriptId = transcriptRes.body._id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create multiple chunks', async () => {
    const res = await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send([
        {
          speakerType: 'AI',
          text: 'Hello, this is AI.',
          startAt: 0,
          endAt: 60,
        },
        {
          speakerType: 'User',
          text: 'Hi, this is user.',
          startAt: 61,
          endAt: 120,
        },
      ]);
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    chunkId = res.body[0]._id;
  });

  it('should get all chunks for a transcript', async () => {
    const res = await request(app.getHttpServer())
      .get(`/transcripts/${transcriptId}/chunks`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]._id).toBe(chunkId);
  });

  it('should get chunks with filters', async () => {
    const res = await request(app.getHttpServer())
      .get(`/transcripts/${transcriptId}/chunks?speakerType=AI&startAt=0&endAt=60`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].speakerType).toBe('AI');
  });

  it('should not allow overlapping time ranges', async () => {
    const res = await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send([
        {
          speakerType: 'User',
          text: 'Overlap test',
          startAt: 30, // overlaps with previous
          endAt: 90,
        },
      ]);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Time range overlaps');
  });

  it('should get a single chunk', async () => {
    const res = await request(app.getHttpServer())
      .get(`/transcripts/${transcriptId}/chunks/${chunkId}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(chunkId);
    expect(res.body.speakerType).toBe('AI');
  });

  it('should return 404 for non-existent chunk', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
    const res = await request(app.getHttpServer())
      .get(`/transcripts/${transcriptId}/chunks/${nonExistentId}`);
    expect(res.status).toBe(404);
  });

  it('should return 404 for non-existent transcript', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
    const res = await request(app.getHttpServer())
      .get(`/transcripts/${nonExistentId}/chunks`);
    expect(res.status).toBe(404);
  });
});
