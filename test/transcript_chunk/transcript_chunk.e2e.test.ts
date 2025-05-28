import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';

describe('TranscriptChunk (e2e)', () => {
  let app: INestApplication;
  let calllogId: string;
  let transcriptId: string;
  let chunkId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    // 先创建 CallLog 和 Transcript
    const calllogRes = await request(app.getHttpServer())
      .post('/calllog')
      .send({
        companyId: 'test-company',
        serviceBookedId: 'test-service',
        callerNumber: '1234567890',
        startAt: new Date(),
      });
    calllogId = calllogRes.body._id;

    const transcriptRes = await request(app.getHttpServer())
      .post('/transcript')
      .send({
        calllogid: calllogId,
        summary: 'Test summary',
      });
    transcriptId = transcriptRes.body._id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a TranscriptChunk', async () => {
    const res = await request(app.getHttpServer())
      .post('/transcript-chunk')
      .send({
        transcriptId,
        speakerType: 'AI',
        text: 'Hello, this is AI.',
        startAt: new Date('2025-01-01T10:00:00Z'),
        endAt: new Date('2025-01-01T10:01:00Z'),
      });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    chunkId = res.body._id;
  });

  it('should get all chunks (global)', async () => {
    const res = await request(app.getHttpServer())
      .get('/transcript-chunk');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.some((c: any) => c._id === chunkId)).toBe(true);
  });

  it('should not allow overlapping time ranges', async () => {
    const res = await request(app.getHttpServer())
      .post('/transcript-chunk')
      .send({
        transcriptId,
        speakerType: 'User',
        text: 'Overlap test',
        startAt: new Date('2025-01-01T10:00:30Z'), // overlaps with previous
        endAt: new Date('2025-01-01T10:01:30Z'),
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Time range overlaps');
  });

  it('should get all chunks for a transcript', async () => {
    const res = await request(app.getHttpServer())
      .get(`/transcript-chunk/${transcriptId}/chunk`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id).toBe(chunkId);
  });

  it('should update a chunk', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/transcript-chunk/${transcriptId}/chunk/${chunkId}`)
      .send({ text: 'Updated text' });
    expect(res.status).toBe(200);
    expect(res.body.text).toBe('Updated text');
  });

  it('should get a single chunk', async () => {
    const res = await request(app.getHttpServer())
      .get(`/transcript-chunk/${transcriptId}/chunk/${chunkId}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(chunkId);
  });

  it('should delete a chunk', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/transcript-chunk/chunk/${chunkId}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(chunkId);
  });

  it('should return empty array after deleting the chunk', async () => {
    const res = await request(app.getHttpServer())
      .get(`/transcript-chunk/${transcriptId}/chunk`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
