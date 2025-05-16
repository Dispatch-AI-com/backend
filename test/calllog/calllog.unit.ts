import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CalllogService } from '../../src/modules/calllog/calllog.service';
import { CallLog } from '../../src/modules/calllog/schema/calllog.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createMockCallLogDto } from './mock-calllog';
import { CallLogStatus } from '../../src/common/constants/calllog.constant';
import { Error as MongooseError } from 'mongoose';

describe('CalllogService (unit)', () => {
  let service: CalllogService;
  let model: any;

  // Create specific test data with known companyIds
  const mockCallLog1 = createMockCallLogDto({ companyId: 'company-1' });
  const mockCallLog2 = createMockCallLogDto({ companyId: 'company-2' });
  const mockCallLogs = [mockCallLog1, mockCallLog2];

  beforeEach(async () => {
    const mockModel = {
      create: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      exec: jest.fn(),
      sort: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalllogService,
        {
          provide: getModelToken(CallLog.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<CalllogService>(CalllogService);
    model = module.get(getModelToken(CallLog.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a call log', async () => {
      model.create.mockResolvedValue(mockCallLog1);
      const result = await service.create(mockCallLog1);
      expect(result).toBe(mockCallLog1);
      expect(model.create).toHaveBeenCalledWith(mockCallLog1);
    });

    it('should throw BadRequestException on create validation error', async () => {
      const validationError = new MongooseError.ValidationError();
      validationError.message = 'Invalid';
      model.create.mockRejectedValue(validationError);
      await expect(service.create(mockCallLog1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all call logs', async () => {
      model.find.mockReturnValue(model);
      model.sort.mockReturnValue(model);
      model.exec.mockResolvedValue(mockCallLogs);
      const result = await service.findAll();
      expect(result).toEqual(mockCallLogs);
    });
  });

  describe('findByCompanyId', () => {
    it('should return call logs for specific companyId', async () => {
      let lastFindQuery: any = {};

      model.find.mockImplementation((query: any) => {
        lastFindQuery = query;
        return model;
      });
      model.sort.mockReturnValue(model);
      model.exec.mockImplementation(() => {
        if (lastFindQuery.companyId === 'company-1') {
          return Promise.resolve([mockCallLog1]);
        } else if (lastFindQuery.companyId === 'company-2') {
          return Promise.resolve([mockCallLog2]);
        }
        return Promise.resolve([]);
      });

      const result = await service.findByCompanyId('company-1');
      expect(result).toEqual([mockCallLog1]);
      expect(model.find).toHaveBeenCalledWith({ companyId: 'company-1' });
    });

    it('should return different call logs for different companyIds', async () => {
      let lastFindQuery: any = {};

      model.find.mockImplementation((query: any) => {
        lastFindQuery = query;
        return model;
      });
      model.sort.mockReturnValue(model);
      model.exec.mockImplementation(() => {
        if (lastFindQuery.companyId === 'company-1') {
          return Promise.resolve([mockCallLog1]);
        } else if (lastFindQuery.companyId === 'company-2') {
          return Promise.resolve([mockCallLog2]);
        }
        return Promise.resolve([]);
      });

      const result1 = await service.findByCompanyId('company-1');
      const result2 = await service.findByCompanyId('company-2');

      expect(result1).toEqual([mockCallLog1]);
      expect(result2).toEqual([mockCallLog2]);
    });

    it('should throw NotFoundException if no call logs for companyId', async () => {
      model.find.mockReturnValue(model);
      model.sort.mockReturnValue(model);
      model.exec.mockResolvedValue([]);
      await expect(service.findByCompanyId('non-existent-company')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStartAt', () => {
    it('should return call logs by date range', async () => {
      model.find.mockReturnValue(model);
      model.sort.mockReturnValue(model);
      model.exec.mockResolvedValue(mockCallLogs);
      const result = await service.findByStartAt(new Date(), new Date());
      expect(result).toEqual(mockCallLogs);
    });
  });

  describe('update', () => {
    it('should update a call log', async () => {
      const updated = { ...mockCallLog1, status: CallLogStatus.Inactive };
      model.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(updated) });
      const result = await service.update('testid', { status: CallLogStatus.Inactive });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if update not found', async () => {
      model.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update('notfound', { status: CallLogStatus.Inactive })).rejects.toThrow(NotFoundException);
    });
  });
});