import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { ServiceBookingController } from '../../../src/modules/service-booking/service-booking.controller';
import { ServiceBookingService } from '../../../src/modules/service-booking/service-booking.service';
import { staticServiceBooking } from '../../fixtures';

// ============================================================================
// Service Booking Controller Unit Tests - Only testing methods used by frontend calendar
// ============================================================================

describe('ServiceBookingController (Unit) - Calendar Focus', () => {
  let controller: ServiceBookingController;
  let service: jest.Mocked<ServiceBookingService>;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceBookingController],
      providers: [
        {
          provide: ServiceBookingService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ServiceBookingController>(ServiceBookingController);
    service = module.get(ServiceBookingService);
  });

  describe('findAllBookings - Used by frontend calendar', () => {
    it('should return all service bookings for a user', async () => {
      const userId = 'test-user';
      const expectedResult = [staticServiceBooking];
      
      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAllBookings(userId);

      expect(service.findAll).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it('should return all service bookings when no userId provided', async () => {
      const expectedResult = [staticServiceBooking];
      
      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAllBookings();

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty results', async () => {
      const userId = 'test-user';
      const expectedResult: any[] = [];
      
      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAllBookings(userId);

      expect(service.findAll).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const userId = 'test-user';
      const error = new Error('Service error');
      
      service.findAll.mockRejectedValue(error);

      await expect(controller.findAllBookings(userId)).rejects.toThrow('Service error');
    });
  });
});