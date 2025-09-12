import { getModelToken } from '@nestjs/mongoose';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { Model } from 'mongoose';

import { ServiceBooking } from '../../../src/modules/service-booking/schema/service-booking.schema';
import { ServiceBookingService } from '../../../src/modules/service-booking/service-booking.service';
import { staticServiceBooking } from '../../fixtures';

// ============================================================================
// Service Booking Service Unit Tests - Only testing methods used by frontend calendar
// ============================================================================

describe('ServiceBookingService (Unit) - Calendar Focus', () => {
  let service: ServiceBookingService;
  let model: jest.Mocked<Model<any>>;

  beforeEach(async () => {
    const mockExec = jest.fn();
    const mockFind = jest.fn().mockReturnValue({
      exec: mockExec,
    });

    const mockModel = {
      find: mockFind,
    } as any;

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

      (model.find().exec as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.findAll(userId);

      expect(model.find).toHaveBeenCalledWith({ userId: { $eq: userId } });
      expect(result).toEqual(expectedResult);
    });

    it('should return all service bookings when no userId provided', async () => {
      const expectedResult = [staticServiceBooking];

      (model.find().exec as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(model.find).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty results', async () => {
      const userId = 'test-user';
      const expectedResult: any[] = [];

      (model.find().exec as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.findAll(userId);

      expect(model.find).toHaveBeenCalledWith({ userId: { $eq: userId } });
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const userId = 'test-user';
      const error = new Error('Database connection failed');

      (model.find().exec as jest.Mock).mockRejectedValue(error);

      await expect(service.findAll(userId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
