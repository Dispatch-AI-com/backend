import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { SettingCategory } from '../../../src/modules/setting/schema/setting.schema';
import { SettingService } from '../../../src/modules/setting/setting.service';
import {
  staticBillingAddress,
  staticCompanyInfo,
  staticUserProfile,
} from '../../fixtures';

describe('SettingService (Unit)', () => {
  let service: SettingService;
  let userModel: any;
  let companyModel: any;
  let settingModel: any;
  let verificationModel: any;

  beforeEach(async () => {
    userModel = { findById: jest.fn() };
    companyModel = { findOne: jest.fn() };
    settingModel = { find: jest.fn(), findOneAndUpdate: jest.fn() };
    verificationModel = { findOneAndUpdate: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingService,
        { provide: getModelToken('Setting'), useValue: settingModel },
        { provide: getModelToken('User'), useValue: userModel },
        { provide: getModelToken('Company'), useValue: companyModel },
        { provide: getModelToken('Verification'), useValue: verificationModel },
      ],
    }).compile();

    service = module.get<SettingService>(SettingService);
  });

  describe('getUserSettingsByCategory', () => {
    it('should throw BadRequestException for invalid userId', async () => {
      await expect(
        service.getUserSettingsByCategory(
          'invalid-id',
          SettingCategory.USER_PROFILE,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return user profile for valid userId and USER_PROFILE category', async () => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          firstName: 'John',
          lastName: 'Doe',
          fullPhoneNumber: staticUserProfile.contact,
          position: 'Manager',
        }),
      });

      const result = await service.getUserSettingsByCategory(
        '507f1f77bcf86cd799439011',
        SettingCategory.USER_PROFILE,
      );
      expect(result).toEqual({
        name: staticUserProfile.name,
        contact: staticUserProfile.contact,
        role: 'Manager',
      });
    });

    it('should return company info for valid userId and COMPANY_INFO category', async () => {
      companyModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          businessName: staticCompanyInfo.companyName,
          abn: staticCompanyInfo.abn,
        }),
      });

      const result = await service.getUserSettingsByCategory(
        '507f1f77bcf86cd799439011',
        SettingCategory.COMPANY_INFO,
      );
      expect(result).toEqual({
        companyName: staticCompanyInfo.companyName,
        abn: staticCompanyInfo.abn,
      });
    });

    it('should return billing address for valid userId and BILLING_ADDRESS category', async () => {
      companyModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          address: {
            unitAptPOBox: staticBillingAddress.unit || '12A',
            streetAddress: staticBillingAddress.streetAddress,
            suburb: staticBillingAddress.suburb,
            state: staticBillingAddress.state,
            postcode: staticBillingAddress.postcode,
          },
        }),
      });

      const result = await service.getUserSettingsByCategory(
        '507f1f77bcf86cd799439011',
        SettingCategory.BILLING_ADDRESS,
      );
      expect(result).toEqual({
        unit: staticBillingAddress.unit || '12A',
        streetAddress: staticBillingAddress.streetAddress,
        suburb: staticBillingAddress.suburb,
        state: staticBillingAddress.state,
        postcode: staticBillingAddress.postcode,
      });
    });
  });

  describe('getAllUserSettings', () => {
    it('should return all user settings for valid userId', async () => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          firstName: 'John',
          lastName: 'Doe',
          fullPhoneNumber: staticUserProfile.contact,
          position: 'Manager',
        }),
      });

      companyModel.findOne.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValueOnce({
            businessName: staticCompanyInfo.companyName,
            abn: staticCompanyInfo.abn,
            address: {
              unitAptPOBox: staticBillingAddress.unit || '12A',
              streetAddress: staticBillingAddress.streetAddress,
              suburb: staticBillingAddress.suburb,
              state: staticBillingAddress.state,
              postcode: staticBillingAddress.postcode,
            },
          })
          .mockResolvedValueOnce({
            address: {
              unitAptPOBox: staticBillingAddress.unit || '12A',
              streetAddress: staticBillingAddress.streetAddress,
              suburb: staticBillingAddress.suburb,
              state: staticBillingAddress.state,
              postcode: staticBillingAddress.postcode,
            },
          }),
      });

      const result = await service.getAllUserSettings(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual({
        userProfile: {
          name: staticUserProfile.name,
          contact: staticUserProfile.contact,
          role: 'Manager',
        },
        companyInfo: {
          companyName: staticCompanyInfo.companyName,
          abn: staticCompanyInfo.abn,
        },
        billingAddress: {
          unit: staticBillingAddress.unit || '12A',
          streetAddress: staticBillingAddress.streetAddress,
          suburb: staticBillingAddress.suburb,
          state: staticBillingAddress.state,
          postcode: staticBillingAddress.postcode,
        },
      });
    });
  });
});
