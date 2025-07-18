import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';

import {
  Company,
  CompanyDocument,
} from '@/modules/company/schema/company.schema';
import { User, UserDocument } from '@/modules/user/schema/user.schema';

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

@Injectable()
export class SettingService {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
  ) {}

  async getUserSettingsByCategory<T = any>(
    userId: string,
    category: SettingCategory,
  ): Promise<T | null> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user id: ${userId}`);
    }

    switch (category) {
      case SettingCategory.USER_PROFILE:
        return (await this.getUserProfile(userId)) as T;
      case SettingCategory.COMPANY_INFO:
        return (await this.getCompanyInfo(userId)) as T;
      case SettingCategory.BILLING_ADDRESS:
        return (await this.getBillingAddress(userId)) as T;
      default:
        return null;
    }
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
      this.getUserProfile(userId),
      this.getCompanyInfo(userId),
      this.getBillingAddress(userId),
    ]);

    return {
      userProfile,
      companyInfo,
      billingAddress,
    };
  }

  async updateUserSettings(
    userId: string,
    updateDto: UpdateUserSettingsDto,
  ): Promise<any> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user id: ${userId}`);
    }

    const { category, settings } = updateDto;

    switch (category) {
      case SettingCategory.USER_PROFILE:
        return await this.updateUserProfile(userId, settings as UserProfileDto);
      case SettingCategory.COMPANY_INFO:
        return await this.updateCompanyInfo(userId, settings as CompanyInfoDto);
      case SettingCategory.BILLING_ADDRESS:
        return await this.updateBillingAddress(
          userId,
          settings as BillingAddressDto,
        );
      default:
        throw new BadRequestException('Invalid category');
    }
  }

  async deleteUserSettingsByCategory(
    userId: string,
    category: SettingCategory,
  ): Promise<void> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user id: ${userId}`);
    }

    switch (category) {
      case SettingCategory.USER_PROFILE:
        await this.clearUserProfile(userId);
        break;
      case SettingCategory.COMPANY_INFO:
        await this.clearCompanyInfo(userId);
        break;
      case SettingCategory.BILLING_ADDRESS:
        await this.clearBillingAddress(userId);
        break;
    }
  }

  async deleteAllUserSettings(userId: string): Promise<void> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user id: ${userId}`);
    }

    await Promise.all([
      this.clearUserProfile(userId),
      this.clearCompanyInfo(userId),
      this.clearBillingAddress(userId),
    ]);
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

  private async getUserProfile(userId: string): Promise<UserProfileDto | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

    return {
      name: fullName,
      contact: user.fullPhoneNumber || '',
      role: user.position || '',
    };
  }

  private async getCompanyInfo(userId: string): Promise<CompanyInfoDto | null> {
    const company = await this.companyModel.findOne({ user: userId }).exec();
    if (!company) return null;

    return {
      companyName: company.businessName,
      abn: company.abn,
    };
  }

  private async getBillingAddress(
    userId: string,
  ): Promise<BillingAddressDto | null> {
    const company = await this.companyModel.findOne({ user: userId }).exec();
    if (!company?.address) return null;

    return {
      unit: company.address.unitAptPOBox || '',
      streetAddress: company.address.streetAddress,
      suburb: company.address.suburb,
      state: company.address.state,
      postcode: company.address.postcode,
    };
  }

  private async updateUserProfile(
    userId: string,
    profileDto: UserProfileDto,
  ): Promise<UserDocument> {
    const nameParts = profileDto.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        fullPhoneNumber: profileDto.contact,
        position: profileDto.role,
      },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      throw new BadRequestException('User not found');
    }

    return updatedUser;
  }

  private async updateCompanyInfo(
    userId: string,
    companyDto: CompanyInfoDto,
  ): Promise<CompanyDocument> {
    if (!this.validateABN(companyDto.abn)) {
      throw new BadRequestException(
        `Invalid ABN format: ${companyDto.abn}. ABN must be 11 digits and pass checksum validation.`,
      );
    }

    // 先查找是否存在company记录
    const existingCompany = await this.companyModel
      .findOne({ user: userId })
      .exec();

    if (!existingCompany) {
      // 如果公司记录不存在，创建新的公司记录
      const timestamp = Date.now().toString();
      const newCompany = new this.companyModel({
        user: userId,
        businessName: companyDto.companyName,
        abn: companyDto.abn,
        email: `company-${userId}-${timestamp}@placeholder.com`,
        number: `+61${userId.slice(-8).padStart(8, '0')}`,
        address: {
          streetAddress: 'To be updated',
          suburb: 'To be updated',
          state: 'To be updated',
          postcode: '0000',
        },
      });

      return await newCompany.save();
    }

    // 更新existing company记录
    const updatedCompany = await this.companyModel.findOneAndUpdate(
      { user: userId },
      {
        businessName: companyDto.companyName,
        abn: companyDto.abn,
      },
      { new: true, runValidators: true },
    );

    if (!updatedCompany) {
      throw new BadRequestException(
        `Failed to update company for user: ${userId}`,
      );
    }

    return updatedCompany;
  }

  private async updateBillingAddress(
    userId: string,
    billingDto: BillingAddressDto,
  ): Promise<CompanyDocument> {
    const existingCompany = await this.companyModel
      .findOne({ user: userId })
      .exec();

    if (!existingCompany) {
      const timestamp = Date.now().toString();
      const newCompany = new this.companyModel({
        user: userId,
        businessName: 'To be updated',
        abn: '00000000000',
        email: `company-${userId}-${timestamp}@placeholder.com`,
        number: `+61${userId.slice(-8).padStart(8, '0')}`,
        address: {
          unitAptPOBox: billingDto.unit,
          streetAddress: billingDto.streetAddress,
          suburb: billingDto.suburb,
          state: billingDto.state,
          postcode: billingDto.postcode,
        },
      });

      return await newCompany.save();
    }

    // 更新existing company记录的地址
    const updatedCompany = await this.companyModel.findOneAndUpdate(
      { user: userId },
      {
        'address.unitAptPOBox': billingDto.unit,
        'address.streetAddress': billingDto.streetAddress,
        'address.suburb': billingDto.suburb,
        'address.state': billingDto.state,
        'address.postcode': billingDto.postcode,
      },
      { new: true, runValidators: true },
    );

    if (!updatedCompany) {
      throw new BadRequestException(
        `Failed to update billing address for user: ${userId}`,
      );
    }

    return updatedCompany;
  }

  private async clearUserProfile(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      firstName: '',
      lastName: '',
      fullPhoneNumber: '',
      position: '',
    });
  }

  private async clearCompanyInfo(userId: string): Promise<void> {
    await this.companyModel.findOneAndUpdate(
      { user: userId },
      {
        businessName: '',
        abn: '',
      },
    );
  }

  private async clearBillingAddress(userId: string): Promise<void> {
    await this.companyModel.findOneAndUpdate(
      { user: userId },
      {
        'address.unitAptPOBox': '',
        'address.streetAddress': '',
        'address.suburb': '',
        'address.state': '',
        'address.postcode': '',
      },
    );
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
