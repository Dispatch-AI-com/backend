import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { SettingCategory } from '../../../src/modules/setting/schema/setting.schema';
import { SettingController } from '../../../src/modules/setting/setting.controller';
import { SettingService } from '../../../src/modules/setting/setting.service';
import {
  createMockBillingAddressDto,
  createMockCompanyInfoDto,
  createMockUserProfileDto,
  staticBillingAddress,
  staticCompanyInfo,
  staticUserProfile,
} from '../../fixtures';

describe('SettingController (Unit)', () => {
  let controller: SettingController;
  let service: jest.Mocked<SettingService>;

  beforeEach(async () => {
    const mockService = {
      getUserSettingsByCategory: jest.fn(),
      updateUserSettings: jest.fn(),
      getAllUserSettings: jest.fn(),
      deleteUserSettingsByCategory: jest.fn(),
      deleteAllUserSettings: jest.fn(),
      seedDefaultSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingController],
      providers: [
        {
          provide: SettingService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SettingController>(SettingController);
    service = module.get(SettingService);
  });

  describe('getUserProfile', () => {
    it('should return user profile settings', async () => {
      service.getUserSettingsByCategory.mockResolvedValue(staticUserProfile);

      const result = await controller.getUserProfile('user-123');

      expect(service.getUserSettingsByCategory).toHaveBeenCalledWith(
        'user-123',
        SettingCategory.USER_PROFILE,
      );
      expect(result).toEqual(staticUserProfile);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile settings', async () => {
      const dto = createMockUserProfileDto();
      const expected = { success: true };

      service.updateUserSettings.mockResolvedValue(expected);

      const result = await controller.updateUserProfile('user-123', dto);

      expect(service.updateUserSettings).toHaveBeenCalledWith('user-123', {
        category: SettingCategory.USER_PROFILE,
        settings: dto,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getCompanyInfo', () => {
    it('should return company info settings', async () => {
      service.getUserSettingsByCategory.mockResolvedValue(staticCompanyInfo);

      const result = await controller.getCompanyInfo('user-123');

      expect(service.getUserSettingsByCategory).toHaveBeenCalledWith(
        'user-123',
        SettingCategory.COMPANY_INFO,
      );
      expect(result).toEqual(staticCompanyInfo);
    });
  });

  describe('updateCompanyInfo', () => {
    it('should update company info settings', async () => {
      const dto = createMockCompanyInfoDto();
      const expected = { success: true };

      service.updateUserSettings.mockResolvedValue(expected);

      const result = await controller.updateCompanyInfo('user-123', dto);

      expect(service.updateUserSettings).toHaveBeenCalledWith('user-123', {
        category: SettingCategory.COMPANY_INFO,
        settings: dto,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getBillingAddress', () => {
    it('should return billing address settings', async () => {
      service.getUserSettingsByCategory.mockResolvedValue(staticBillingAddress);

      const result = await controller.getBillingAddress('user-123');

      expect(service.getUserSettingsByCategory).toHaveBeenCalledWith(
        'user-123',
        SettingCategory.BILLING_ADDRESS,
      );
      expect(result).toEqual(staticBillingAddress);
    });
  });

  describe('updateBillingAddress', () => {
    it('should update billing address settings', async () => {
      const dto = createMockBillingAddressDto();
      const expected = { success: true };

      service.updateUserSettings.mockResolvedValue(expected);

      const result = await controller.updateBillingAddress('user-123', dto);

      expect(service.updateUserSettings).toHaveBeenCalledWith('user-123', {
        category: SettingCategory.BILLING_ADDRESS,
        settings: dto,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getAllUserSettings', () => {
    it('should return all user settings', async () => {
      const expected = {
        userProfile: staticUserProfile,
        companyInfo: staticCompanyInfo,
        billingAddress: staticBillingAddress,
      };

      service.getAllUserSettings.mockResolvedValue(expected);

      const result = await controller.getAllUserSettings('user-123');

      expect(service.getAllUserSettings).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(expected);
    });
  });

  describe('deleteUserSettingsByCategory', () => {
    it('should delete user settings by category', async () => {
      service.deleteUserSettingsByCategory.mockResolvedValue(undefined);

      await controller.deleteUserSettingsByCategory('user-123', SettingCategory.USER_PROFILE);

      expect(service.deleteUserSettingsByCategory).toHaveBeenCalledWith(
        'user-123',
        SettingCategory.USER_PROFILE,
      );
    });
  });

  describe('deleteAllUserSettings', () => {
    it('should delete all user settings', async () => {
      service.deleteAllUserSettings.mockResolvedValue(undefined);

      await controller.deleteAllUserSettings('user-123');

      expect(service.deleteAllUserSettings).toHaveBeenCalledWith('user-123');
    });
  });

  describe('seedDefaultSettings', () => {
    it('should seed default settings', async () => {
      service.seedDefaultSettings.mockResolvedValue(undefined);

      await controller.seedDefaultSettings();

      expect(service.seedDefaultSettings).toHaveBeenCalled();
    });
  });

  describe('getProfileForFrontend', () => {
    it('should return user profile for frontend', async () => {
      service.getUserSettingsByCategory.mockResolvedValue(staticUserProfile);

      const result = await controller.getProfileForFrontend('user-123');

      expect(service.getUserSettingsByCategory).toHaveBeenCalledWith(
        'user-123',
        SettingCategory.USER_PROFILE,
      );
      expect(result).toEqual(staticUserProfile);
    });
  });

  describe('updateProfileForFrontend', () => {
    it('should update user profile for frontend', async () => {
      const dto = createMockUserProfileDto();
      const expected = { success: true };

      service.updateUserSettings.mockResolvedValue(expected);

      const result = await controller.updateProfileForFrontend('user-123', dto);

      expect(service.updateUserSettings).toHaveBeenCalledWith('user-123', {
        category: SettingCategory.USER_PROFILE,
        settings: dto,
      });
      expect(result).toEqual(expected);
    });
  });
});