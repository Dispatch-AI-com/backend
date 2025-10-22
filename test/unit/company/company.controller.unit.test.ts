import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { CompanyController } from '../../../src/modules/company/company.controller';
import { CompanyService } from '../../../src/modules/company/company.service';
import {
  createMockCreateCompanyDto,
  createMockUpdateCompanyDto,
  staticCompany,
} from '../../fixtures';

// ============================================================================
// Company Controller Unit Tests - Testing individual methods with mocked dependencies
// ============================================================================

describe('CompanyController (Unit)', () => {
  let controller: CompanyController;
  let service: jest.Mocked<CompanyService>;

  const mockRequest = {
    user: {
      _id: '6640e7330fdebe50da1a05f1',
      email: 'test@example.com',
      role: 'user',
    },
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByUserEmail: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get(CompanyService);
  });

  describe('create', () => {
    it('should create a company and associate it with the authenticated user', async () => {
      const createCompanyDto = createMockCreateCompanyDto();
      const expectedResult = {
        ...staticCompany,
        ...createCompanyDto,
        user: mockRequest.user._id,
      };

      service.create.mockResolvedValue(expectedResult as any);

      const result = await controller.create(createCompanyDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith({
        ...createCompanyDto,
        user: mockRequest.user._id,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all companies', async () => {
      const companies = [staticCompany, staticCompany];
      service.findAll.mockResolvedValue(companies as any);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(companies);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no companies exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a company by id', async () => {
      const companyId = '6640e7330fdebe50da1a05f2';
      service.findOne.mockResolvedValue(staticCompany as any);

      const result = await controller.findOne(companyId);

      expect(service.findOne).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(staticCompany);
    });
  });

  describe('findByUserEmail', () => {
    it('should return a company by email', async () => {
      const email = 'test@example.com';
      service.findByUserEmail.mockResolvedValue(staticCompany as any);

      const result = await controller.findByUserEmail(email);

      expect(service.findByUserEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(staticCompany);
    });
  });

  describe('update', () => {
    it('should update a company', async () => {
      const companyId = '6640e7330fdebe50da1a05f2';
      const updateCompanyDto = createMockUpdateCompanyDto();
      const updatedCompany = { ...staticCompany, ...updateCompanyDto };

      service.update.mockResolvedValue(updatedCompany as any);

      const result = await controller.update(companyId, updateCompanyDto);

      expect(service.update).toHaveBeenCalledWith(companyId, updateCompanyDto);
      expect(result).toEqual(updatedCompany);
    });
  });

  describe('remove', () => {
    it('should delete a company', async () => {
      const companyId = '6640e7330fdebe50da1a05f2';
      service.remove.mockResolvedValue(undefined);

      await controller.remove(companyId);

      expect(service.remove).toHaveBeenCalledWith(companyId);
    });
  });

  describe('findByUserId', () => {
    it('should return a company by user id', async () => {
      const userId = '6640e7330fdebe50da1a05f1';
      service.findByUserId.mockResolvedValue(staticCompany as any);

      const result = await controller.findByUserId(userId);

      expect(service.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(staticCompany);
    });
  });
});


