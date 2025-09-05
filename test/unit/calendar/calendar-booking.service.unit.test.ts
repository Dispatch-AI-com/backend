import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { ServiceBookingService } from '../../../src/modules/service-booking/service-booking.service';
import { ServiceBooking } from '../../../src/modules/service-booking/schema/service-booking.schema';
import { staticServiceBooking } from '../../fixtures';

// ============================================================================
// Service Booking Service Unit Tests - Only testing methods used by frontend calendar
// ============================================================================

describe('ServiceBookingService (Unit) - Calendar Focus', () => {
  let service: ServiceBookingService;
  let model: jest.Mocked<Model<any>>;

  beforeEach(async () => {
    const mockModel = jest.fn();
    mockModel.find = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceBookingService,
        {
          provide: getModelToken(ServiceBooking.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ServiceBookingService>(ServiceBookingService);
    model = module.get(getModelToken(ServiceBooking.name));
  });

  describe('findAll - Used by frontend calendar', () => {
    it('should return service bookings for a user', async () => {
      const userId = 'test-user';
      const expectedResult = [staticServiceBooking];
      
      model.find().exec.mockResolvedValue(expectedResult);

      const result = await service.findAll(userId);

      expect(model.find).toHaveBeenCalledWith({ userId: { $eq: userId } });
      expect(result).toEqual(expectedResult);
    });

    it('should return all service bookings when no userId provided', async () => {
      const expectedResult = [staticServiceBooking];
      
      model.find().exec.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(model.find).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty results', async () => {
      const userId = 'test-user';
      const expectedResult: any[] = [];
      
      model.find().exec.mockResolvedValue(expectedResult);

      const result = await service.findAll(userId);

      expect(model.find).toHaveBeenCalledWith({ userId: { $eq: userId } });
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