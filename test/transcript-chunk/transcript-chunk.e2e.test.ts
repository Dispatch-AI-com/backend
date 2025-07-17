import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';

describe('TranscriptChunk (e2e)', () => {
  let app: INestApplication;
  let calllogId: string;
  let transcriptId: string;
  let chunkId: string;
  const testUserId = 'test-user';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  }, 30000);

  beforeEach(async () => {
    // Create fresh calllog and transcript for each test
    const calllogRes = await request(app.getHttpServer())
      .post(`/users/${testUserId}/calllogs`)
      .send({
        userId: testUserId,
        serviceBookedId: 'test-service',
        callerNumber: '1234567890',
        callerName: 'Test User',
        startAt: new Date(),
      });
    calllogId = calllogRes.body._id;

    const transcriptRes = await request(app.getHttpServer())
      .post(`/calllogs/${calllogId}/transcript`)
      .send({
        summary: 'Test summary',
      });
    transcriptId = transcriptRes.body._id;
  });

  afterEach(async () => {
    // Clean up after each test
    if (calllogId) {
      await request(app.getHttpServer())
        .delete(`/users/${testUserId}/calllogs/${calllogId}`);
    }
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
        },
        {
          speakerType: 'User',
          text: 'Hi, this is user.',
          startAt: 61,
        },
      ]);
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    chunkId = res.body[0]._id;
  });

  it('should not allow creating chunk with duplicate startAt', async () => {
    // First create a chunk
    await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send({
        speakerType: 'AI',
        text: 'Original chunk',
        startAt: 0,
      });

    // Try to create another chunk with the same startAt
    const res = await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send({
        speakerType: 'AI',
        text: 'Duplicate start time test',
        startAt: 0, // Same startAt as the first chunk
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Chunk with start time 0 already exists');
  });

  it('should not allow creating multiple chunks with duplicate startAt', async () => {
    const res = await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send([
        {
          speakerType: 'AI',
          text: 'First chunk',
          startAt: 100,
        },
        {
          speakerType: 'User',
          text: 'Second chunk with same start time',
          startAt: 100, // Duplicate startAt
        },
      ]);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Duplicate start times are not allowed');
  });

  it('should get all chunks for a transcript', async () => {
    // First create some chunks
    await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send([
        {
          speakerType: 'AI',
          text: 'Hello, this is AI.',
          startAt: 0,
        },
        {
          speakerType: 'User',
          text: 'Hi, this is user.',
          startAt: 61,
        },
      ]);

    const res = await request(app.getHttpServer())
      .get(`/transcripts/${transcriptId}/chunks`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('should get chunks with filters', async () => {
    // First create some chunks
    await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send([
        {
          speakerType: 'AI',
          text: 'Hello, this is AI.',
          startAt: 0,
        },
        {
          speakerType: 'User',
          text: 'Hi, this is user.',
          startAt: 61,
        },
      ]);

    const res = await request(app.getHttpServer())
      .get(`/transcripts/${transcriptId}/chunks?speakerType=AI&startAt=0`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].speakerType).toBe('AI');
  });

  it('should get a single chunk', async () => {
    // First create a chunk
    const createRes = await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send({
        speakerType: 'AI',
        text: 'Hello, this is AI.',
        startAt: 0,
      });
    const createdChunkId = createRes.body._id;

    const res = await request(app.getHttpServer())
      .get(`/transcripts/${transcriptId}/chunks/${createdChunkId}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(createdChunkId);
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
