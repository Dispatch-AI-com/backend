import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/modules/app.module';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

/**
 * Telephony Flow End-to-End Tests
 * 
 * 测试从通话开始到会话转换为数据库记录的完整流程
 */
describe('Telephony Flow (e2e)', () => {
  let app: INestApplication;
  const testCallSid = `test-e2e-${Date.now()}`;

  beforeAll(async () => {
    // Mock AI service responses to avoid external dependencies
    const mockHttpService = {
      post: jest.fn()
        .mockReturnValue(of({
          data: { replyText: 'Thank you for calling. How can I help?' }
        }))
        .mockReturnValueOnce(of({
          data: { replyText: 'I understand you need assistance.' }
        }))
        .mockReturnValueOnce(of({
          data: {
            summary: 'Customer service call completed',
            keyPoints: ['Customer inquiry handled']
          }
        }))
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(HttpService)
    .useValue(mockHttpService)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000); // 增加超时时间

  afterAll(async () => {
    await app.close();
  }, 30000); // 增加超时时间

  describe('Complete Call Flow', () => {
    it('should handle voice webhook and return TwiML', async () => {
      const response = await request(app.getHttpServer())
        .post('/telephony/voice')
        .send(`CallSid=${testCallSid}`)
        .expect(200);

      expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(response.text).toContain('<Response>');
      expect(response.text).toContain('<Say');
      expect(response.text).toContain('<Gather');
    }, 15000); // 增加超时时间

    it('should handle gather webhook with speech input', async () => {
      const speechResult = 'Hi, I need a plumber for my kitchen sink.';
      
      const response = await request(app.getHttpServer())
        .post('/telephony/gather')
        .send(`CallSid=${testCallSid}&SpeechResult=${encodeURIComponent(speechResult)}`)
        .expect(200);

      expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(response.text).toContain('<Response>');
    }, 15000); // 增加超时时间

    it('should handle status webhook for call completion', async () => {
      const timestamp = new Date().toISOString();
      
      const response = await request(app.getHttpServer())
        .post('/telephony/status')
        .send([
          `CallSid=${testCallSid}`,
          'CallStatus=completed',
          `Timestamp=${timestamp}`,
          'CallDuration=180',
          'Caller=+61400123456'
        ].join('&'))
        .expect(200);

      // Status webhook should complete without error
      expect(response.status).toBe(200);
    }, 15000); // 增加超时时间
  });

  describe('API Routes Validation', () => {
    it('should have health endpoint available', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'dispatchAI API');
    });

    it('should have database health endpoint available', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/db')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('database', 'MongoDB');
      expect(response.body).toHaveProperty('connected', true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid CallSid gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/telephony/voice')
        .send('CallSid=')
        .expect(200);

      // Should still return valid TwiML even with empty CallSid
      expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    }, 15000); // 增加超时时间

    it('should handle gather without speech input', async () => {
      const response = await request(app.getHttpServer())
        .post('/telephony/gather')
        .send(`CallSid=${testCallSid}`)
        .expect(200);

      expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(response.text).toContain('<Response>');
    }, 15000); // 增加超时时间
  });
});