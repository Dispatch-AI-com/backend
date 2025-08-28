import { settingSchema } from './../../src/modules/setting/schema/setting.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SettingService } from '../../src/modules/setting/setting.service';
import { SettingCategory } from '../../src/modules/setting/schema/setting.schema';
import { BadRequestException } from '@nestjs/common';

describe('SettingService', () => {
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
            service.getUserSettingsByCategory('invalid-id', SettingCategory.USER_PROFILE),
        ).rejects.toThrow(BadRequestException);
        });

        it('should return user profile for valid userId and USER_PROFILE category', async () => {
        userModel.findById.mockReturnValue({
            exec: jest.fn().mockResolvedValue({
            firstName: 'John',
            lastName: 'Doe',
            fullPhoneNumber: '0412345678',
            position: 'Manager',
            }),
        });

        const result = await service.getUserSettingsByCategory(
            '507f1f77bcf86cd799439011',
            SettingCategory.USER_PROFILE,
        );
        expect(result).toEqual({
            name: 'John Doe',
            contact: '0412345678',
            role: 'Manager',
        });
        });

        it('should return company info for valid userId and COMPANY_INFO category', async () => {
        companyModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
            businessName: 'ivygo',
            abn: '12345678901',
        }),
        });

        const result = await service.getUserSettingsByCategory(
        '507f1f77bcf86cd799439011',
        SettingCategory.COMPANY_INFO,
        );
        expect(result).toEqual({
        companyName: 'ivygo',
        abn: '12345678901',
        });
    });

        it('should return billing address for valid userId and BILLING_ADDRESS category', async () => {
        companyModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
            address: {
            unitAptPOBox: '12A',
            streetAddress: '123 Main St',
            suburb: 'Sydney',
            state: 'NSW',
            postcode: '2000',
            },
        }),
        });

        const result = await service.getUserSettingsByCategory(
        '507f1f77bcf86cd799439011',
        SettingCategory.BILLING_ADDRESS,
        );
        expect(result).toEqual({
        unit: '12A',
        streetAddress: '123 Main St',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        });
    });
    });

    describe('getAllUserSettings', () => {
    it('should return all user settings for valid userId', async () => {
        userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
            firstName: 'John',
            lastName: 'Doe',
            fullPhoneNumber: '0412345678',
            position: 'Manager',
        }),
        });

        companyModel.findOne.mockReturnValue({
        exec: jest.fn()
            .mockResolvedValueOnce({
            businessName: 'ivygo',
            abn: '12345678901',
            address: {
                unitAptPOBox: '12A',
                streetAddress: '123 Main St',
                suburb: 'Sydney',
                state: 'NSW',
                postcode: '2000',
            },
            })
            .mockResolvedValueOnce({
            address: {
                unitAptPOBox: '12A',
                streetAddress: '123 Main St',
                suburb: 'Sydney',
                state: 'NSW',
                postcode: '2000',
            },
            }),
        });

        const result = await service.getAllUserSettings('507f1f77bcf86cd799439011');
        expect(result).toEqual({
        userProfile: {
            name: 'John Doe',
            contact: '0412345678',
            role: 'Manager',
        },
        companyInfo: {
            companyName: 'ivygo',
            abn: '12345678901',
        },
        billingAddress: {
            unit: '12A',
            streetAddress: '123 Main St',
            suburb: 'Sydney',
            state: 'NSW',
            postcode: '2000',
        },
        });
    });
    });
});