import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { TranscriptController } from '../../../src/modules/transcript/transcript.controller';
import { TranscriptService } from '../../../src/modules/transcript/transcript.service';
import { createMockTranscriptDto, staticTranscript } from '../../fixtures';

// ============================================================================
// Transcript Controller Unit Tests - Testing individual methods with mocked dependencies
// ============================================================================

describe('TranscriptController (Unit)', () => {
  let controller: TranscriptController;
  let service: jest.Mocked<TranscriptService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findByCallLogId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findCallLogById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranscriptController],
      providers: [
        {
          provide: TranscriptService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TranscriptController>(TranscriptController);
    service = module.get(TranscriptService);
  });

  describe('create', () => {
    it('should create a transcript', async () => {
      const calllogId = 'calllog-123';
      const createTranscriptDto = createMockTranscriptDto();
      const mockCallLog = {
        callSid: 'CA1234567890abcdef',
        userId: 'user-123',
        callerNumber: '1234567890',
        startAt: new Date(),
      };
      const expectedResult = {
        ...staticTranscript,
        ...createTranscriptDto,
        _id: staticTranscript._id.toString(),
      } as any;

      service.findCallLogById.mockResolvedValue(mockCallLog as any);
      service.create.mockResolvedValue(expectedResult as any);

      const result = await controller.create(calllogId, createTranscriptDto);

      expect(service.findCallLogById).toHaveBeenCalledWith(calllogId);
      expect(service.create).toHaveBeenCalledWith({
        callSid: mockCallLog.callSid,
        summary: createTranscriptDto.summary,
        keyPoints: createTranscriptDto.keyPoints,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByCalllogId', () => {
    it('should return transcript by call log ID', async () => {
      const calllogId = 'calllog-123';
      const expectedResult = staticTranscript;

      service.findByCallLogId.mockResolvedValue(expectedResult as any);

      const result = await controller.findByCalllogId(calllogId);

      expect(service.findByCallLogId).toHaveBeenCalledWith(calllogId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateByCalllogId', () => {
    it('should update transcript by call log ID', async () => {
      const calllogId = 'calllog-123';
      const updateTranscriptDto = { summary: 'Updated summary' };
      const mockTranscript = {
        _id: 'transcript-123',
        callSid: 'CA1234567890abcdef',
        summary: 'Test summary',
      };
      const expectedResult = {
        ...staticTranscript,
        ...updateTranscriptDto,
        _id: staticTranscript._id.toString(),
      };

      service.findByCallLogId.mockResolvedValue(mockTranscript as any);
      service.update.mockResolvedValue(expectedResult as any);

      const result = await controller.updateByCalllogId(
        calllogId,
        updateTranscriptDto,
      );

      expect(service.findByCallLogId).toHaveBeenCalledWith(calllogId);
      expect(service.update).toHaveBeenCalledWith(
        mockTranscript._id.toString(),
        updateTranscriptDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteByCalllogId', () => {
    it('should delete transcript by call log ID', async () => {
      const calllogId = 'calllog-123';
      const mockTranscript = {
        _id: 'transcript-123',
        callSid: 'CA1234567890abcdef',
        summary: 'Test summary',
      };
      const expectedResult = {
        ...staticTranscript,
        _id: staticTranscript._id.toString(),
      };

      service.findByCallLogId.mockResolvedValue(mockTranscript as any);
      service.delete.mockResolvedValue(expectedResult as any);

      const result = await controller.deleteByCalllogId(calllogId);

      expect(service.findByCallLogId).toHaveBeenCalledWith(calllogId);
      expect(service.delete).toHaveBeenCalledWith(
        mockTranscript._id.toString(),
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
