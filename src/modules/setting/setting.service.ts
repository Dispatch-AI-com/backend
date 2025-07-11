import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';

import { CreateSettingDto } from './dto/create-setting.dto';
import {
  BillingAddressDto,
  CompanyInfoDto,
  UpdateUserSettingsDto,
  UserProfileDto,
} from './dto/user-settings.dto';
import {
  Setting,
  SettingCategory,
  SettingDocument,
} from './schema/setting.schema';
import { UserSetting, UserSettingDocument } from './schema/user-setting.schema';

@Injectable()
export class SettingService {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
    @InjectModel(UserSetting.name)
    private readonly userSettingModel: Model<UserSettingDocument>,
  ) {}

  async getUserSettingsByCategory<T = any>(
    userId: string,
    category: SettingCategory,
  ): Promise<T | null> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user id: ${userId}`);
    }

    const userSetting = await this.userSettingModel
      .findOne({ userId, category })
      .exec();

    return (userSetting?.settings as T) ?? null;
  }

  async getAllUserSettings(userId: string): Promise<{
    userProfile: UserProfileDto | null;
    companyInfo: CompanyInfoDto | null;
    billingAddress: BillingAddressDto | null;
  }> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user id: ${userId}`);
    }

    const [userProfile, companyInfo, billingAddress] = await Promise.all([
      this.getUserSettingsByCategory(userId, SettingCategory.USER_PROFILE),
      this.getUserSettingsByCategory(userId, SettingCategory.COMPANY_INFO),
      this.getUserSettingsByCategory(userId, SettingCategory.BILLING_ADDRESS),
    ]);

    return {
      userProfile: userProfile as UserProfileDto | null,
      companyInfo: companyInfo as CompanyInfoDto | null,
      billingAddress: billingAddress as BillingAddressDto | null,
    };
  }

  async updateUserSettings(
    userId: string,
    updateDto: UpdateUserSettingsDto,
  ): Promise<UserSetting> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user id: ${userId}`);
    }

    const { category, settings } = updateDto;

    if (category === SettingCategory.COMPANY_INFO) {
      const companyInfo = settings as CompanyInfoDto;
      if (!this.validateABN(companyInfo.abn)) {
        throw new BadRequestException('Invalid ABN format');
      }
    }

    const updatedSetting = await this.userSettingModel.findOneAndUpdate(
      { userId, category },
      { userId, category, settings },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    return updatedSetting;
  }

  async deleteUserSettingsByCategory(
    userId: string,
    category: SettingCategory,
  ): Promise<void> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user id: ${userId}`);
    }

    await this.userSettingModel.deleteOne({ userId, category }).exec();
  }

  async deleteAllUserSettings(userId: string): Promise<void> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user id: ${userId}`);
    }

    await this.userSettingModel.deleteMany({ userId }).exec();
  }

  async createDefaultSetting(
    createSettingDto: CreateSettingDto,
  ): Promise<Setting> {
    const setting = new this.settingModel(createSettingDto);
    return await setting.save();
  }

  async getDefaultSettingsByCategory(
    category: SettingCategory,
  ): Promise<Setting[]> {
    return await this.settingModel.find({ category }).exec();
  }

  async seedDefaultSettings(): Promise<void> {
    const defaultSettings = [
      {
        key: 'profile.name',
        value: '',
        category: SettingCategory.USER_PROFILE,
        description: 'User name',
      },
      {
        key: 'profile.contact',
        value: '',
        category: SettingCategory.USER_PROFILE,
        description: 'Contact phone number',
      },
      {
        key: 'profile.role',
        value: '',
        category: SettingCategory.USER_PROFILE,
        description: 'User role',
      },
      {
        key: 'company.name',
        value: '',
        category: SettingCategory.COMPANY_INFO,
        description: 'Company name',
      },
      {
        key: 'company.abn',
        value: '',
        category: SettingCategory.COMPANY_INFO,
        description: 'Australian Business Number',
      },
      {
        key: 'billing.unit',
        value: '',
        category: SettingCategory.BILLING_ADDRESS,
        description: 'Unit/Apartment/PO Box',
      },
      {
        key: 'billing.streetAddress',
        value: '',
        category: SettingCategory.BILLING_ADDRESS,
        description: 'Street address',
      },
      {
        key: 'billing.suburb',
        value: '',
        category: SettingCategory.BILLING_ADDRESS,
        description: 'Suburb',
      },
      {
        key: 'billing.state',
        value: '',
        category: SettingCategory.BILLING_ADDRESS,
        description: 'State',
      },
      {
        key: 'billing.postcode',
        value: '',
        category: SettingCategory.BILLING_ADDRESS,
        description: 'Postcode',
      },
    ];

    for (const setting of defaultSettings) {
      await this.settingModel.findOneAndUpdate({ key: setting.key }, setting, {
        upsert: true,
        new: true,
      });
    }
  }

  private validateABN(abn: string): boolean {
    try {
      const cleanAbn = abn.replace(/\D/g, '');

      if (cleanAbn.length !== 11) {
        return false;
      }

      const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
      let sum = 0;

      const firstDigit = parseInt(cleanAbn[0]) - 1;
      sum += firstDigit * weights[0];

      for (let i = 1; i < 11; i++) {
        sum += parseInt(cleanAbn[i]) * weights[i];
      }

      return sum % 89 === 0;
    } catch {
      return false;
    }
  }
}
