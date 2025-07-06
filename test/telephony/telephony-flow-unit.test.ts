import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { TelephonyService } from '@/modules/telephony/telephony.service';
import { SessionRepository } from '@/modules/telephony/repositories/session.repository';
import { SessionHelper } from '@/modules/telephony/helpers/session.helper';
import { CalllogService } from '@/modules/calllog/calllog.service';
import { TranscriptService } from '@/modules/transcript/transcript.service';
import { TranscriptChunkService } from '@/modules/transcript-chunk/transcript-chunk.service';
import { of } from 'rxjs';

/**
 * Telephony Service Integration Tests
 * 
 * 测试TelephonyService的集成功能，使用mock替代外部依赖
 */
describe('TelephonyService - Integration', () => {
  let service: TelephonyService;
  let mockHttpService: jest.Mocked<HttpService>;
  let mockSessionRepository: jest.Mocked<SessionRepository>;
  let mockSessionHelper: jest.Mocked<SessionHelper>;

  const mockSession = {
    callSid: 'test-call-integration',
    services: [{ id: 'service-1', name: 'Plumbing', price: 100 }],
    company: { id: 'company-123', name: 'Test Company', email: 'test@company.com' },
    user: {
      service: { id: 'service-1', name: 'Plumbing', price: 100 },
      serviceBookedTime: '2024-03-21T10:00:00Z',
      userInfo: { name: 'John Test', phone: '+61400123456', email: 'john@test.com' }
    },
    history: [
      { speaker: 'AI' as const, message: 'Welcome! How can I help?', startedAt: '2024-03-21T09:00:00Z' },
      { speaker: 'customer' as const, message: 'I need help', startedAt: '2024-03-21T09:00:30Z' }
    ],
    confirmBooking: true,
    confirmEmailSent: false
  };

  beforeEach(async () => {
    // Mock HTTP responses for AI service
    const mockAIResponse = {
      data: { replyText: 'Thank you for calling. How can I help you today?' }
    };

    const mockSummaryResponse = {
      data: {
        summary: 'Customer contacted for service inquiry',
        keyPoints: ['Service inquiry', 'Booking discussion']
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelephonyService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn()
              .mockReturnValueOnce(of(mockAIResponse))  // for /ai/reply
              .mockReturnValueOnce(of(mockSummaryResponse))  // for /ai/summary
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            load: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: SessionHelper,
          useValue: {
            ensureSession: jest.fn(),
            appendUserMessage: jest.fn(),
            appendAiMessage: jest.fn(),
          },
        },
        {
          provide: CalllogService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: TranscriptService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: TranscriptChunkService,
          useValue: {
            createMany: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TelephonyService>(TelephonyService);
    mockHttpService = module.get(HttpService);
    mockSessionRepository = module.get(SessionRepository);
    mockSessionHelper = module.get(SessionHelper);
  });

  describe('handleVoice', () => {
    it('should return welcome TwiML response', async () => {
      mockSessionHelper.ensureSession.mockResolvedValue(mockSession);

      const result = await service.handleVoice({ 
        CallSid: 'test-call',
        From: '+61400123456',
        To: '+61412345678',
        CallStatus: 'in-progress'
      });

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<Response>');
      expect(result).toContain('<Say');
      expect(result).toContain('Welcome!');
      expect(mockSessionHelper.ensureSession).toHaveBeenCalledWith('test-call');
    });
  });

  describe('handleGather', () => {
    it('should process speech input and return AI response', async () => {
      mockSessionHelper.ensureSession.mockResolvedValue(mockSession);
      mockSessionHelper.appendUserMessage.mockResolvedValue();
      mockSessionHelper.appendAiMessage.mockResolvedValue();

      const result = await service.handleGather({
        CallSid: 'test-call',
        From: '+61400123456',
        To: '+61412345678',
        CallStatus: 'in-progress',
        SpeechResult: 'I need a plumber'
      });

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<Response>');
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://dispatchai-ai:8000/api/ai/reply',
        { callSid: 'test-call', message: 'I need a plumber' }
      );
    });

    it('should handle AI service errors gracefully', async () => {
      mockSessionHelper.ensureSession.mockResolvedValue(mockSession);
      mockSessionHelper.appendUserMessage.mockResolvedValue();
      mockSessionHelper.appendAiMessage.mockResolvedValue();
      mockHttpService.post.mockImplementation(() => {
        throw new Error('AI service unavailable');
      });

      const result = await service.handleGather({
        CallSid: 'test-call',
        From: '+61400123456',
        To: '+61412345678',
        CallStatus: 'in-progress',
        SpeechResult: 'Hello'
      });

      // Should still return valid TwiML even on AI error
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<Response>');
    });
  });

  describe('handleStatus', () => {
    it('should process call completion successfully', async () => {
      mockSessionRepository.load.mockResolvedValue(mockSession);

      await service.handleStatus({
        CallSid: 'test-call',
        CallStatus: 'completed',
        Timestamp: '2024-03-21T09:03:00Z',
        CallDuration: '180',
        Caller: '+61400123456'
      });

      // Verify session was loaded for processing
      expect(mockSessionRepository.load).toHaveBeenCalledWith('test-call');
    });

    it('should ignore non-final call statuses', async () => {
      await service.handleStatus({
        CallSid: 'test-call',
        CallStatus: 'ringing',
        Timestamp: '2024-03-21T09:00:00Z',
        CallDuration: '0',
        Caller: '+61400123456'
      });

      // Verify session repository was not called for non-final status
      expect(mockSessionRepository.load).not.toHaveBeenCalled();
    });
  });
});