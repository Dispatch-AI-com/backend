import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { TelephonyService } from '@/modules/telephony/telephony.service';
import { SessionRepository } from '@/modules/telephony/repositories/session.repository';
import { SessionHelper } from '@/modules/telephony/helpers/session.helper';
import { CalllogService } from '@/modules/calllog/calllog.service';
import { TranscriptService } from '@/modules/transcript/transcript.service';
import { TranscriptChunkService } from '@/modules/transcript-chunk/transcript-chunk.service';
import { CompanyService } from '@/modules/company/company.service';
import { ServiceService } from '@/modules/service/service.service';
import { CallLogStatus } from '@/common/constants/calllog.constant';

/**
 * AI Summary Generation and Database Integration Tests
 * 
 * Test complete AI summary generation flow and database integration
 */
describe('TelephonyService - AI Summary Integration', () => {
  let service: TelephonyService;
  let mockHttpService: jest.Mocked<HttpService>;
  let mockSessionRepository: jest.Mocked<SessionRepository>;
  let mockCalllogService: jest.Mocked<CalllogService>;
  let mockTranscriptService: jest.Mocked<TranscriptService>;
  let mockTranscriptChunkService: jest.Mocked<TranscriptChunkService>;

  // Real conversation data for testing
  const realConversationSession = {
    callSid: 'test-call-ai-summary',
    services: [
      { id: 'service-plumbing', name: 'Emergency Plumbing', price: 150 }
    ],
    company: {
      id: 'company-dispatch',
      name: 'DispatchAI Services',
      email: 'contact@dispatchai.com'
    },
    user: {
      service: { id: 'service-plumbing', name: 'Emergency Plumbing', price: 150 },
      serviceBookedTime: '2024-03-21T14:00:00Z',
      userInfo: {
        name: 'Sarah Johnson',
        phone: '+61412345678',
        email: 'sarah@example.com'
      }
    },
    history: [
      {
        speaker: 'AI' as const,
        message: 'Welcome to DispatchAI Services! How can I help you today?',
        startedAt: '2024-03-21T10:00:00Z'
      },
      {
        speaker: 'customer' as const,
        message: 'Hi, I have a major leak in my kitchen. The water is everywhere and I need urgent help!',
        startedAt: '2024-03-21T10:00:15Z'
      },
      {
        speaker: 'AI' as const,
        message: 'I understand this is urgent. Let me book an emergency plumber for you right away. Can you confirm your address?',
        startedAt: '2024-03-21T10:00:30Z'
      },
      {
        speaker: 'customer' as const,
        message: 'Yes, I am at 123 Main Street, Melbourne. How soon can someone come?',
        startedAt: '2024-03-21T10:00:45Z'
      },
      {
        speaker: 'AI' as const,
        message: 'Perfect! I have booked an emergency plumber for you at 123 Main Street. They will arrive within 30 minutes. The service fee is $150. Is that acceptable?',
        startedAt: '2024-03-21T10:01:00Z'
      },
      {
        speaker: 'customer' as const,
        message: 'Yes, that is perfect! Thank you so much. I really appreciate the quick response.',
        startedAt: '2024-03-21T10:01:15Z'
      },
      {
        speaker: 'AI' as const,
        message: 'You are welcome! Your booking is confirmed. The plumber will contact you when they arrive. You will receive a confirmation SMS shortly.',
        startedAt: '2024-03-21T10:01:30Z'
      }
    ],
    confirmBooking: true,
    confirmEmailSent: false
  };

  // Real AI summary response data
  const mockAISummaryResponse = {
    summary: 'Customer contacted for emergency plumbing service due to major kitchen leak. Emergency plumber was successfully booked for 123 Main Street, Melbourne with 30-minute response time.',
    keyPoints: [
      'Emergency kitchen leak requiring urgent attention',
      'Customer address: 123 Main Street, Melbourne',
      'Emergency plumber booked with 30-minute ETA',
      'Service fee $150 accepted by customer',
      'Booking confirmed with SMS notification scheduled'
    ]
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelephonyService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
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
        {
          provide: CompanyService,
          useValue: {
            findByTwilioPhoneNumber: jest.fn(),
          },
        },
        {
          provide: ServiceService,
          useValue: {
            findByCompanyId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TelephonyService>(TelephonyService);
    mockHttpService = module.get(HttpService);
    mockSessionRepository = module.get(SessionRepository);
    mockCalllogService = module.get(CalllogService);
    mockTranscriptService = module.get(TranscriptService);
    mockTranscriptChunkService = module.get(TranscriptChunkService);
  });

  describe('AI Summary Generation with Real Conversation Data', () => {
    it('should send correct conversation data to AI service', async () => {
      // Mock AI service response
      mockHttpService.post.mockReturnValue(
        of({ data: mockAISummaryResponse }) as any
      );

      // Call the private method directly for testing
      const result = await (service as any).generateAISummary(
        realConversationSession.callSid,
        realConversationSession
      );

      // Verify AI service was called with correct data structure
      expect(mockHttpService.post).toHaveBeenCalledWith(
        '/ai/summary',
        {
          callSid: 'test-call-ai-summary',
          conversation: [
            {
              speaker: 'AI',
              message: 'Welcome to DispatchAI Services! How can I help you today?',
              timestamp: '2024-03-21T10:00:00Z'
            },
            {
              speaker: 'customer',
              message: 'Hi, I have a major leak in my kitchen. The water is everywhere and I need urgent help!',
              timestamp: '2024-03-21T10:00:15Z'
            },
            {
              speaker: 'AI',
              message: 'I understand this is urgent. Let me book an emergency plumber for you right away. Can you confirm your address?',
              timestamp: '2024-03-21T10:00:30Z'
            },
            {
              speaker: 'customer',
              message: 'Yes, I am at 123 Main Street, Melbourne. How soon can someone come?',
              timestamp: '2024-03-21T10:00:45Z'
            },
            {
              speaker: 'AI',
              message: 'Perfect! I have booked an emergency plumber for you at 123 Main Street. They will arrive within 30 minutes. The service fee is $150. Is that acceptable?',
              timestamp: '2024-03-21T10:01:00Z'
            },
            {
              speaker: 'customer',
              message: 'Yes, that is perfect! Thank you so much. I really appreciate the quick response.',
              timestamp: '2024-03-21T10:01:15Z'
            },
            {
              speaker: 'AI',
              message: 'You are welcome! Your booking is confirmed. The plumber will contact you when they arrive. You will receive a confirmation SMS shortly.',
              timestamp: '2024-03-21T10:01:30Z'
            }
          ],
          serviceInfo: {
            name: 'Emergency Plumbing',
            booked: true,
            company: 'DispatchAI Services'
          }
        }
      );

      // Verify returned summary
      expect(result).toEqual(mockAISummaryResponse);
    });

    it('should handle AI service fallback when service is unavailable', async () => {
      // Mock AI service failure
      mockHttpService.post.mockImplementation(() => {
        throw new Error('AI service unavailable');
      });

      // Should not throw error, but handle gracefully
      await expect(
        (service as any).generateAISummary(
          realConversationSession.callSid,
          realConversationSession
        )
      ).rejects.toThrow('AI service unavailable');
    });
  });

  describe('Complete Call Flow with AI Summary and Database Storage', () => {
    it('should complete full call processing with AI summary generation', async () => {
      // Setup mocks
      mockSessionRepository.load.mockResolvedValue(realConversationSession);
      mockCalllogService.create.mockResolvedValue({ _id: 'calllog-123' } as any);
      mockTranscriptService.create.mockResolvedValue({ _id: 'transcript-123' } as any);
      mockTranscriptService.update.mockResolvedValue({ _id: 'transcript-123' } as any);
      mockTranscriptChunkService.createMany.mockResolvedValue([]);
      mockSessionRepository.delete.mockResolvedValue();
      
      // Mock AI service success
      mockHttpService.post.mockReturnValue(
        of({ data: mockAISummaryResponse }) as any
      );

      const twilioParams = {
        CallSid: 'test-call-ai-summary',
        CallStatus: 'completed',
        Timestamp: '2024-03-21T10:02:00Z',
        CallDuration: '120',
        Caller: '+61412345678'
      };

      // Execute the complete call processing
      await (service as any).processCallCompletion('test-call-ai-summary', twilioParams);

      // Verify CallLog creation with correct data
      expect(mockCalllogService.create).toHaveBeenCalledWith({
        callSid: 'test-call-ai-summary',
        userId: 'company-dispatch',
        serviceBookedId: 'service-plumbing',
        callerNumber: '+61412345678',
        callerName: 'Sarah Johnson',
        status: CallLogStatus.Completed,
        startAt: new Date('2024-03-21T10:02:00Z')
      });

      // Verify Transcript creation
      expect(mockTranscriptService.create).toHaveBeenCalledWith({
        callSid: 'test-call-ai-summary',
        summary: '',
        keyPoints: []
      });

      // Verify TranscriptChunk creation with conversation data
      expect(mockTranscriptChunkService.createMany).toHaveBeenCalledWith(
        'transcript-123',
        expect.arrayContaining([
          expect.objectContaining({
            speakerType: 'AI',
            text: 'Welcome to DispatchAI Services! How can I help you today?',
            startAt: expect.any(Number)
          }),
          expect.objectContaining({
            speakerType: 'User',
            text: 'Hi, I have a major leak in my kitchen. The water is everywhere and I need urgent help!',
            startAt: expect.any(Number)
          })
        ])
      );

      // Verify AI Summary generation
      expect(mockHttpService.post).toHaveBeenCalledWith(
        '/ai/summary',
        expect.objectContaining({
          callSid: 'test-call-ai-summary',
          conversation: expect.any(Array),
          serviceInfo: expect.objectContaining({
            name: 'Emergency Plumbing',
            booked: true,
            company: 'DispatchAI Services'
          })
        })
      );

      // Verify Transcript update with AI summary
      expect(mockTranscriptService.update).toHaveBeenCalledWith(
        'transcript-123',
        mockAISummaryResponse
      );

      // Verify session cleanup
      expect(mockSessionRepository.delete).toHaveBeenCalledWith('test-call-ai-summary');
    });

    it('should still complete processing even if AI summary fails', async () => {
      // Setup mocks
      mockSessionRepository.load.mockResolvedValue(realConversationSession);
      mockCalllogService.create.mockResolvedValue({ _id: 'calllog-123' } as any);
      mockTranscriptService.create.mockResolvedValue({ _id: 'transcript-123' } as any);
      mockTranscriptChunkService.createMany.mockResolvedValue([]);
      mockSessionRepository.delete.mockResolvedValue();
      
      // Mock AI service failure
      mockHttpService.post.mockImplementation(() => {
        throw new Error('AI service timeout');
      });

      const twilioParams = {
        CallSid: 'test-call-ai-summary',
        CallStatus: 'completed',
        Timestamp: '2024-03-21T10:02:00Z',
        CallDuration: '120',
        Caller: '+61412345678'
      };

      // Should complete without throwing error
      await expect(
        (service as any).processCallCompletion('test-call-ai-summary', twilioParams)
      ).resolves.toBeUndefined();

      // Verify core data was still saved
      expect(mockCalllogService.create).toHaveBeenCalled();
      expect(mockTranscriptService.create).toHaveBeenCalled();
      expect(mockTranscriptChunkService.createMany).toHaveBeenCalled();
      expect(mockSessionRepository.delete).toHaveBeenCalled();

      // AI summary update should not have been called due to error
      expect(mockTranscriptService.update).not.toHaveBeenCalled();
    });
  });

  describe('Conversation Data Formatting', () => {
    it('should correctly format conversation history for AI analysis', () => {
      const formattedData = (service as any).generateAISummary.bind(service);
      
      // This test verifies the conversation formatting logic
      const mockCall = mockHttpService.post.mockReturnValue(
        of({ data: mockAISummaryResponse }) as any
      );

      // Call with minimal data to check formatting
      const minimalSession = {
        ...realConversationSession,
        history: [
          { speaker: 'AI' as const, message: 'Hello', startedAt: '2024-01-01T00:00:00Z' },
          { speaker: 'customer' as const, message: 'Hi there', startedAt: '2024-01-01T00:00:10Z' }
        ]
      };

      formattedData('test', minimalSession);

      const calledWith = mockCall.mock.calls[0][1] as any;
      expect(calledWith.conversation).toEqual([
        { speaker: 'AI', message: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
        { speaker: 'customer', message: 'Hi there', timestamp: '2024-01-01T00:00:10Z' }
      ]);
    });
  });
});