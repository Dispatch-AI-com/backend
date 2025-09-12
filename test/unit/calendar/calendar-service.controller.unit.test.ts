import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { ServiceController } from '../../../src/modules/service/service.controller';
import { ServiceService } from '../../../src/modules/service/service.service';

// ============================================================================
// Service Controller Unit Tests - Only testing methods used by frontend calendar
// ============================================================================

describe('ServiceController (Unit) - Calendar Focus', () => {
  let controller: ServiceController;
  let service: jest.Mocked<ServiceService>;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [
        {
          provide: ServiceService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ServiceController>(ServiceController);
    service = module.get(ServiceService);
  });

  describe('findAll - Used by frontend calendar', () => {
    it('should return all services for a user', async () => {
      const userId = 'test-user';
      const expectedResult = [
        {
          _id: 'service-1',
          name: 'Test Service 1',
          price: 100,
          isAvailable: true,
          userId: userId,
        },
      ];

      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(userId);

      expect(service.findAll).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it('should return all services when no userId provided', async () => {
      const expectedResult = [
        {
          _id: 'service-1',
          name: 'Test Service 1',
          price: 100,
          isAvailable: true,
          userId: 'default-user',
        },
      ];

      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty results', async () => {
      const userId = 'test-user';
      const expectedResult: any[] = [];

      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(userId);

      expect(service.findAll).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const userId = 'test-user';
      const error = new Error('Service error');

      service.findAll.mockRejectedValue(error);

      await expect(controller.findAll(userId)).rejects.toThrow('Service error');
    });
  });
});
