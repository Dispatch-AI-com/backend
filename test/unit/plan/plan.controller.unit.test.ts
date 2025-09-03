
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { PlanController } from '../../../src/modules/plan/plan.controller';
import { PlanService } from '../../../src/modules/plan/plan.service';
import { createMockPlanDto, createMockUpdatePlanDto } from '../../fixtures/dynamic/plan';
import { staticBasicPlan, staticInactivePlan, staticProPlan, staticPlan } from '../../fixtures/static/plan';

// ============================================================================
// Plan Controller Unit Tests - Testing individual methods with mocked dependencies
// ============================================================================

describe('PlanController (Unit)', () => {
  let controller: PlanController;
  let service: jest.Mocked<PlanService>;

  beforeEach(async () => {
    const mockService = {
      createPlan: jest.fn(),
      getAllActivePlans: jest.fn(),
      getPlanById: jest.fn(),
      updatePlan: jest.fn(),
      patchPlan: jest.fn(),
      deletePlan: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanController],
      providers: [
        {
          provide: PlanService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PlanController>(PlanController);
    service = module.get(PlanService);
  });

  describe('create', () => {
    it('should create a plan', async () => {
      const createPlanDto = createMockPlanDto();
      const expectedResult = { ...staticPlan, ...createPlanDto };

      service.createPlan.mockResolvedValue(expectedResult as any);

      const result = await controller.create(createPlanDto);

      expect(service.createPlan).toHaveBeenCalledWith(createPlanDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all active plans', async () => {
      const expectedResult = [staticPlan];

      service.getAllActivePlans.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.getAllActivePlans).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should return a plan by id', async () => {
      const planId = 'plan-123';
      const expectedResult = staticPlan;

      service.getPlanById.mockResolvedValue(expectedResult as any);

      const result = await controller.findById(planId);

      expect(service.getPlanById).toHaveBeenCalledWith(planId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should fully update a plan', async () => {
      const planId = 'plan-123';
      const updatePlanDto = createMockUpdatePlanDto();
      const expectedResult = { ...staticPlan, ...updatePlanDto };

      service.updatePlan.mockResolvedValue(expectedResult as any);

      const result = await controller.update(planId, updatePlanDto);

      expect(service.updatePlan).toHaveBeenCalledWith(planId, updatePlanDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('patch', () => {
    it('should partially update a plan', async () => {
      const planId = 'plan-123';
      const partialUpdate = { name: 'Updated Plan Name' };
      const expectedResult = { ...staticPlan, ...partialUpdate };

      service.patchPlan.mockResolvedValue(expectedResult as any);

      const result = await controller.patch(planId, partialUpdate);

      expect(service.patchPlan).toHaveBeenCalledWith(planId, partialUpdate);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('delete', () => {
    it('should delete a plan', async () => {
      const planId = 'plan-123';

      service.deletePlan.mockResolvedValue(undefined);

      await controller.remove(planId);

      expect(service.deletePlan).toHaveBeenCalledWith(planId);
    });
  });
});

