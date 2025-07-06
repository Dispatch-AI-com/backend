import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { TelephonyService } from '@/modules/telephony/telephony.service';
import { SessionRepository } from '@/modules/telephony/repositories/session.repository';
import { SessionHelper } from '@/modules/telephony/helpers/session.helper';
import { CalllogService } from '@/modules/calllog/calllog.service';
import { TranscriptService } from '@/modules/transcript/transcript.service';
import { TranscriptChunkService } from '@/modules/transcript-chunk/transcript-chunk.service';
import { CallLogStatus } from '@/common/constants/calllog.constant';

/**
 * Telephony Service Unit Tests
 * 
 * 重点测试会话转换逻辑的核心功能
 */
describe('TelephonyService - Session Conversion', () => {
  let service: TelephonyService;
  let mockSessionRepository: jest.Mocked<SessionRepository>;
  let mockCalllogService: jest.Mocked<CalllogService>;
  let mockTranscriptService: jest.Mocked<TranscriptService>;
  let mockTranscriptChunkService: jest.Mocked<TranscriptChunkService>;

  const mockSession = {
    callSid: 'test-call-123',
    services: [
      { id: 'service-1', name: 'Plumbing', price: 100 }
    ],
    company: {
      id: 'company-123',
      name: 'Test Company',
      email: 'test@company.com'
    },
    user: {
      service: { id: 'service-1', name: 'Plumbing', price: 100 },
      serviceBookedTime: '2024-03-21T10:00:00Z',
      userInfo: {
        name: 'John Test',
        phone: '+61400123456',
        email: 'john@test.com'
      }
    },
    history: [
      {
        speaker: 'AI' as const,
        message: 'Welcome! How can I help you today?',
        startedAt: '2024-03-21T09:00:00Z'
      },
      {
        speaker: 'customer' as const,
        message: 'I need a plumber.',
        startedAt: '2024-03-21T09:00:30Z'
      }
    ],
    confirmBooking: true,
    confirmEmailSent: false
  };

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelephonyService,
        {
          provide: HttpService,
          useValue: mockHttpService,
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
    mockSessionRepository = module.get(SessionRepository);
    mockCalllogService = module.get(CalllogService);
    mockTranscriptService = module.get(TranscriptService);
    mockTranscriptChunkService = module.get(TranscriptChunkService);
  });

  describe('determineCallLogStatus', () => {
    it('should return Completed when booking is confirmed and service exists', () => {
      const session = { ...mockSession, confirmBooking: true };
      // 通过反射访问私有方法进行测试
      const status = (service as any).determineCallLogStatus(session);
      expect(status).toBe(CallLogStatus.Completed);
    });

    it('should return FollowUp when service exists but booking is not confirmed', () => {
      const session = { ...mockSession, confirmBooking: false };
      const status = (service as any).determineCallLogStatus(session);
      expect(status).toBe(CallLogStatus.FollowUp);
    });

    it('should return Missed when no service is selected', () => {
      const session = { ...mockSession, user: { ...mockSession.user, service: undefined } };
      const status = (service as any).determineCallLogStatus(session);
      expect(status).toBe(CallLogStatus.Missed);
    });
  });

  describe('convertMessagesToChunks', () => {
    it('should convert session messages to transcript chunks', () => {
      const chunks = (service as any).convertMessagesToChunks(mockSession.history);
      
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual({
        speakerType: 'AI',
        text: 'Welcome! How can I help you today?',
        startAt: expect.any(Number)
      });
      expect(chunks[1]).toEqual({
        speakerType: 'User',
        text: 'I need a plumber.',
        startAt: expect.any(Number)
      });
    });

    it('should handle empty message history', () => {
      const chunks = (service as any).convertMessagesToChunks([]);
      expect(chunks).toHaveLength(0);
    });
  });

  describe('createCallLogRecord', () => {
    it('should create CallLog with correct data mapping', async () => {
      const twilioParams = {
        CallSid: 'test-call-123',
        CallStatus: 'completed',
        Timestamp: '2024-03-21T09:03:00Z',
        CallDuration: '180',
        Caller: '+61400123456'
      };

      mockCalllogService.create.mockResolvedValue({} as any);

      await (service as any).createCallLogRecord(mockSession, twilioParams);

      expect(mockCalllogService.create).toHaveBeenCalledWith({
        callSid: 'test-call-123',
        userId: 'company-123',
        serviceBookedId: 'service-1',
        callerNumber: '+61400123456',
        callerName: 'John Test',
        status: CallLogStatus.Completed,
        startAt: new Date('2024-03-21T09:03:00Z')
      });
    });

    it('should prioritize Twilio Caller over user phone', async () => {
      const twilioParams = {
        CallSid: 'test-call-123',
        CallStatus: 'completed',
        Timestamp: '2024-03-21T09:03:00Z',
        CallDuration: '180',
        Caller: '+61400999999'
      };

      mockCalllogService.create.mockResolvedValue({} as any);

      await (service as any).createCallLogRecord(mockSession, twilioParams);

      expect(mockCalllogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          callerNumber: '+61400999999'
        })
      );
    });

    it('should always use Twilio Caller as callerNumber', async () => {
      const twilioParams = {
        CallSid: 'test-call-123',
        CallStatus: 'completed',
        Timestamp: '2024-03-21T09:03:00Z',
        CallDuration: '180',
        Caller: '+61400888888'
      };

      mockCalllogService.create.mockResolvedValue({} as any);

      await (service as any).createCallLogRecord(mockSession, twilioParams);

      expect(mockCalllogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          callerNumber: '+61400888888'
        })
      );
    });
  });

  describe('processCallCompletion', () => {
    it('should handle missing session gracefully', async () => {
      mockSessionRepository.load.mockResolvedValue(null);

      // 应该不抛出错误
      await expect(
        (service as any).processCallCompletion('nonexistent-call', {})
      ).resolves.toBeUndefined();

      expect(mockCalllogService.create).not.toHaveBeenCalled();
    });

    it('should complete full conversion process when session exists', async () => {
      mockSessionRepository.load.mockResolvedValue(mockSession);
      mockCalllogService.create.mockResolvedValue({} as any);
      mockTranscriptService.create.mockResolvedValue({ _id: 'transcript-123' } as any);
      mockTranscriptChunkService.createMany.mockResolvedValue([] as any);
      mockSessionRepository.delete.mockResolvedValue();

      const twilioParams = {
        CallSid: 'test-call-123',
        CallStatus: 'completed',
        Timestamp: '2024-03-21T09:03:00Z',
        CallDuration: '180',
        Caller: '+61400123456'
      };

      await (service as any).processCallCompletion('test-call-123', twilioParams);

      // 验证所有步骤都被调用
      expect(mockCalllogService.create).toHaveBeenCalled();
      expect(mockTranscriptService.create).toHaveBeenCalled();
      expect(mockTranscriptChunkService.createMany).toHaveBeenCalled();
      expect(mockSessionRepository.delete).toHaveBeenCalledWith('test-call-123');
    });
  });
});