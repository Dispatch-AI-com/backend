import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';
import { DatabaseTestHelper } from '../helpers/database.helper';
import {
  mockCreateChunkDto,
  mockCreateMultipleChunksDto,
  mockCreateDuplicateChunksDto,
} from '../fixtures/mock-data';

describe('TranscriptChunk (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dbHelper: DatabaseTestHelper;

  const testUserId = 'test-user';
  const nonExistentId = '507f1f77bcf86cd799439999';

  // Helper to create calllog and transcript for chunk tests
  const createCalllogAndTranscript = async () => {
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

    const transcriptRes = await request(app.getHttpServer())
      .post(`/calllogs/${calllogId}/transcript`)
      .send({
        summary: 'Test summary',
        keyPoints: ['Test key point'],
      });

    return {
      calllogId,
      transcriptId: transcriptRes.body._id,
      callSid,
    };
  };

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
    // Clean up before each test
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

  it('should create multiple chunks', async () => {
    const { transcriptId } = await createCalllogAndTranscript();

    const res = await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send(mockCreateMultipleChunksDto);

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('_id');
    expect(res.body[0].speakerType).toBe('AI');
    expect(res.body[1].speakerType).toBe('User');
  });

  it('should not allow creating chunk with duplicate startAt', async () => {
    const { transcriptId } = await createCalllogAndTranscript();

    // First create a chunk via API
    await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send([mockCreateChunkDto]);

    // Try to create another chunk with the same startAt via API
    const res = await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send([mockCreateChunkDto]); // This has startAt: 0

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'Some chunks with the same start times already exist',
    );
  });

  it('should not allow creating multiple chunks with duplicate startAt', async () => {
    const { transcriptId } = await createCalllogAndTranscript();

    const res = await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send(mockCreateDuplicateChunksDto);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Duplicate start times are not allowed');
  });

  it('should get all chunks for a transcript', async () => {
    const { transcriptId } = await createCalllogAndTranscript();

    // First create some chunks via API
    await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send(mockCreateMultipleChunksDto);

    const res = await request(app.getHttpServer()).get(
      `/transcripts/${transcriptId}/chunks`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('should get chunks with filters', async () => {
    const { transcriptId } = await createCalllogAndTranscript();

    // First create some chunks via API
    await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send(mockCreateMultipleChunksDto);

    const res = await request(app.getHttpServer()).get(
      `/transcripts/${transcriptId}/chunks?speakerType=AI&startAt=0`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].speakerType).toBe('AI');
  });

  it('should get a single chunk', async () => {
    const { transcriptId } = await createCalllogAndTranscript();

    // First create some chunks via API
    const createRes = await request(app.getHttpServer())
      .post(`/transcripts/${transcriptId}/chunks`)
      .send(mockCreateMultipleChunksDto);
    const chunkId = createRes.body[0]._id;

    const res = await request(app.getHttpServer()).get(
      `/transcripts/${transcriptId}/chunks/${chunkId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(chunkId);
    expect(res.body.speakerType).toBe('AI');
    expect(res.body.text).toBe('Hello, this is AI.');
  });

  it('should return 404 for non-existent chunk', async () => {
    const { transcriptId } = await createCalllogAndTranscript();

    const res = await request(app.getHttpServer()).get(
      `/transcripts/${transcriptId}/chunks/${nonExistentId}`,
    );
    expect(res.status).toBe(404);
  });

  it('should return 404 for non-existent transcript', async () => {
    const res = await request(app.getHttpServer()).get(
      `/transcripts/${nonExistentId}/chunks`,
    );
    expect(res.status).toBe(404);
  });
});
