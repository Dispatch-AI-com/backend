import { Test, TestingModule } from '@nestjs/testing';
import { CalllogController } from '../../../src/modules/calllog/calllog.controller';
import { CalllogService } from '../../../src/modules/calllog/calllog.service';
import { createMockCallLogDto, staticCallLog } from '../../fixtures';

// ============================================================================
// CallLog Controller Unit Tests - Testing individual methods with mocked dependencies
// ============================================================================

describe('CalllogController (Unit)', () => {
  let controller: CalllogController;
  let service: jest.Mocked<CalllogService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getSummary: jest.fn(),
      getTodayMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalllogController],
      providers: [
        {
          provide: CalllogService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CalllogController>(CalllogController);
    service = module.get(CalllogService);
  });

  describe('create', () => {
    it('should create a call log', async () => {
      const createCallLogDto = createMockCallLogDto();
      const expectedResult = { ...staticCallLog, ...createCallLogDto };

      service.create.mockResolvedValue(expectedResult);

      const result = await controller.create('user-123', createCallLogDto);

      expect(service.create).toHaveBeenCalledWith({ ...createCallLogDto, userId: 'user-123' });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated call logs', async () => {
      const expectedResult = {
        data: [staticCallLog],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll('user-123');

      expect(service.findAll).toHaveBeenCalledWith({
        userId: 'user-123',
        search: undefined,
        startAtFrom: undefined,
        startAtTo: undefined,
        sort: undefined,
        page: 1,
        limit: 10,
        fields: undefined,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should handle query parameters', async () => {
      const queryParams = {
        search: 'test',
        startAtFrom: '2025-01-01',
        startAtTo: '2025-01-31',
        sort: 'newest' as const,
        page: 2,
        limit: 20,
        fields: 'id,status',
      };

      const expectedResult = {
        data: [staticCallLog],
        pagination: {
          page: 2,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll('user-123', ...Object.values(queryParams));

      expect(service.findAll).toHaveBeenCalledWith({
        userId: 'user-123',
        search: 'test',
        startAtFrom: '2025-01-01',
        startAtTo: '2025-01-31',
        sort: 'newest',
        page: 2,
        limit: 20,
        fields: { id: 1, status: 1 },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single call log', async () => {
      const calllogId = 'calllog-123';
      const expectedResult = staticCallLog;

      service.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('user-123', calllogId);

      expect(service.findOne).toHaveBeenCalledWith('user-123', calllogId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a call log', async () => {
      const calllogId = 'calllog-123';
      const updateDto = { callerName: 'Updated Name' };
      const expectedResult = { ...staticCallLog, ...updateDto };

      service.update.mockResolvedValue(expectedResult);

      const result = await controller.update('user-123', calllogId, updateDto);

      expect(service.update).toHaveBeenCalledWith('user-123', calllogId, updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('delete', () => {
    it('should delete a call log', async () => {
      const calllogId = 'calllog-123';
      const expectedResult = staticCallLog;

      service.delete.mockResolvedValue(expectedResult);

      const result = await controller.delete('user-123', calllogId);

      expect(service.delete).toHaveBeenCalledWith('user-123', calllogId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getSummary', () => {
    it('should return call logs summary', async () => {
      const expectedResult = {
        totalCalls: 10,
        totalDuration: 3600,
        averageDuration: 360,
      };

      service.getSummary.mockResolvedValue(expectedResult);

      const result = await controller.getSummary('user-123');

      expect(service.getSummary).toHaveBeenCalledWith('user-123', undefined, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should handle date range parameters', async () => {
      const startAtFrom = '2025-01-01';
      const startAtTo = '2025-01-31';
      const expectedResult = {
        totalCalls: 5,
        totalDuration: 1800,
        averageDuration: 360,
      };

      service.getSummary.mockResolvedValue(expectedResult);

      const result = await controller.getSummary('user-123', startAtFrom, startAtTo);

      expect(service.getSummary).toHaveBeenCalledWith('user-123', startAtFrom, startAtTo);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getTodayMetrics', () => {
    it('should return today metrics', async () => {
      const serviceResult = { totalCalls: 5 };
      const expectedResult = { totalCalls: 5 };

      service.getTodayMetrics.mockResolvedValue(serviceResult);

      const result = await controller.getTodayMetrics('user-123');

      expect(service.getTodayMetrics).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(expectedResult);
    });

    it('should handle non-numeric totalCalls', async () => {
      const serviceResult = { totalCalls: 'invalid' as any };
      const expectedResult = { totalCalls: 0 };

      service.getTodayMetrics.mockResolvedValue(serviceResult);

      const result = await controller.getTodayMetrics('user-123');

      expect(service.getTodayMetrics).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(expectedResult);
    });
  });
});
