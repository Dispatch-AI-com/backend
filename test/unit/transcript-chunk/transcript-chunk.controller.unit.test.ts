import { Test, TestingModule } from '@nestjs/testing';
import { TranscriptChunkController } from '../../../src/modules/transcript-chunk/transcript-chunk.controller';
import { TranscriptChunkService } from '../../../src/modules/transcript-chunk/transcript-chunk.service';
import { 
  createMockTranscriptChunkDto, 
  staticTranscriptChunks,
  mockCreateChunkDto,
  mockCreateMultipleChunksDto,
  mockQueryParams,
  mockPaginationResponse
} from '../../fixtures';

// ============================================================================
// TranscriptChunk Controller Unit Tests - Testing individual methods with mocked dependencies
// ============================================================================

describe('TranscriptChunkController (Unit)', () => {
  let controller: TranscriptChunkController;
  let service: jest.Mocked<TranscriptChunkService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      createMany: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranscriptChunkController],
      providers: [
        {
          provide: TranscriptChunkService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TranscriptChunkController>(TranscriptChunkController);
    service = module.get(TranscriptChunkService);
  });

  describe('create', () => {
    it('should create a single transcript chunk', async () => {
      const transcriptId = 'transcript-123';
      const createChunkDto = createMockTranscriptChunkDto();
      const expectedResult = staticTranscriptChunks[0];

      service.create.mockResolvedValue(expectedResult);

      const result = await controller.create(transcriptId, createChunkDto);

      expect(service.create).toHaveBeenCalledWith(transcriptId, createChunkDto);
      expect(result).toEqual(expectedResult);
    });

    it('should create multiple transcript chunks', async () => {
      const transcriptId = 'transcript-123';
      const createChunksDto = mockCreateMultipleChunksDto;
      const expectedResult = staticTranscriptChunks;

      service.createMany.mockResolvedValue(expectedResult);

      const result = await controller.create(transcriptId, createChunksDto);

      expect(service.createMany).toHaveBeenCalledWith(transcriptId, createChunksDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated transcript chunks', async () => {
      const transcriptId = 'transcript-123';
      const query = mockQueryParams;
      const expectedResult = {
        data: staticTranscriptChunks,
        pagination: mockPaginationResponse,
      };

      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(transcriptId, query);

      expect(service.findAll).toHaveBeenCalledWith(transcriptId, query);
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty query parameters', async () => {
      const transcriptId = 'transcript-123';
      const query = {};
      const expectedResult = {
        data: staticTranscriptChunks,
        pagination: mockPaginationResponse,
      };

      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(transcriptId, query);

      expect(service.findAll).toHaveBeenCalledWith(transcriptId, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single transcript chunk', async () => {
      const transcriptId = 'transcript-123';
      const chunkId = 'chunk-123';
      const expectedResult = staticTranscriptChunks[0];

      service.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(transcriptId, chunkId);

      expect(service.findOne).toHaveBeenCalledWith(transcriptId, chunkId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a transcript chunk', async () => {
      const transcriptId = 'transcript-123';
      const chunkId = 'chunk-123';
      const updateDto = { text: 'Updated text' };
      const expectedResult = { ...staticTranscriptChunks[0], ...updateDto };

      service.update.mockResolvedValue(expectedResult);

      const result = await controller.update(chunkId, updateDto);

      expect(service.update).toHaveBeenCalledWith(chunkId, updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('delete', () => {
    it('should delete a transcript chunk', async () => {
      const transcriptId = 'transcript-123';
      const chunkId = 'chunk-123';
      const expectedResult = staticTranscriptChunks[0];

      service.delete.mockResolvedValue(expectedResult);

      const result = await controller.delete(chunkId);

      expect(service.delete).toHaveBeenCalledWith(chunkId);
      expect(result).toEqual(expectedResult);
    });
  });
});
