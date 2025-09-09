import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { ServiceService } from '../../../src/modules/service/service.service';
import { Service } from '../../../src/modules/service/schema/service.schema';

// ============================================================================
// Service Service Unit Tests - Only testing methods used by frontend calendar
// ============================================================================

describe('ServiceService (Unit) - Calendar Focus', () => {
  let service: ServiceService;
  let model: jest.Mocked<Model<any>>;

  beforeEach(async () => {
    const mockModel = jest.fn();
    mockModel.find = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: getModelToken(Service.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
    model = module.get(getModelToken(Service.name));
  });

  describe('findAll - Used by frontend calendar', () => {
    it('should return services for a user', async () => {
      const userId = 'test-user';
      const expectedResult = [
        {
          _id: 'service-1',
          name: 'Test Service 1',
          price: 100,
          isAvailable: true,
          userId: userId,
        },
        {
          _id: 'service-2', 
          name: 'Test Service 2',
          price: 200,
          isAvailable: false,
          userId: userId,
        },
      ];
      
      model.find().exec.mockResolvedValue(expectedResult);

      const result = await service.findAll(userId);

      expect(model.find).toHaveBeenCalledWith({ 
        userId: { $eq: userId },
        isDeleted: { $ne: true }
      });
      expect(result).toEqual(expectedResult);
    });

    it('should return all services when no userId provided', async () => {
      const expectedResult = [
        {
          _id: 'service-1',
          name: 'Test Service 1',
          price: 100,
          isAvailable: true,
        },
      ];
      
      model.find().exec.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(model.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty results', async () => {
      const userId = 'test-user';
      const expectedResult: any[] = [];
      
      model.find().exec.mockResolvedValue(expectedResult);

      const result = await service.findAll(userId);

      expect(model.find).toHaveBeenCalledWith({ 
        userId: { $eq: userId },
        isDeleted: { $ne: true }
      });
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const userId = 'test-user';
      const error = new Error('Database connection failed');
      
      model.find().exec.mockRejectedValue(error);

      await expect(service.findAll(userId)).rejects.toThrow('Database connection failed');
    });
  });
});