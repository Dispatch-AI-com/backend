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

  const mockCallLog = createMockCallLogDto();

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
      model.create.mockResolvedValue(mockCallLog);
      const result = await service.create(mockCallLog);
      expect(result).toBe(mockCallLog);
      expect(model.create).toHaveBeenCalledWith(mockCallLog);
    });

    it('should throw BadRequestException on create validation error', async () => {
      const validationError = new MongooseError.ValidationError();
      validationError.message = 'Invalid';
      model.create.mockRejectedValue(validationError);
      await expect(service.create(mockCallLog)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all call logs', async () => {
      model.find.mockReturnValue(model);
      model.sort.mockReturnValue(model);
      model.exec.mockResolvedValue([mockCallLog]);
      const result = await service.findAll();
      expect(result).toEqual([mockCallLog]);
    });
  });

  describe('findByCompanyId', () => {
    it('should return call logs by companyId', async () => {
      model.find.mockReturnValue(model);
      model.sort.mockReturnValue(model);
      model.exec.mockResolvedValue([mockCallLog]);
      const result = await service.findByCompanyId('company-1');
      expect(result).toEqual([mockCallLog]);
    });

    it('should throw NotFoundException if no call logs for companyId', async () => {
      model.find.mockReturnValue(model);
      model.sort.mockReturnValue(model);
      model.exec.mockResolvedValue([]);
      await expect(service.findByCompanyId('company-2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStartAt', () => {
    it('should return call logs by date range', async () => {
      model.find.mockReturnValue(model);
      model.sort.mockReturnValue(model);
      model.exec.mockResolvedValue([mockCallLog]);
      const result = await service.findByStartAt(new Date(), new Date());
      expect(result).toEqual([mockCallLog]);
    });
  });

  describe('update', () => {
    it('should update a call log', async () => {
      const updated = { ...mockCallLog, status: CallLogStatus.Inactive };
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