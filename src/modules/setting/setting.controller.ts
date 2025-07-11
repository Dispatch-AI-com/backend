import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  BillingAddressDto,
  CompanyInfoDto,
  UserProfileDto,
} from './dto/user-settings.dto';
import { SettingCategory } from './schema/setting.schema';
import { UserSetting } from './schema/user-setting.schema';
import { SettingService } from './setting.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('user/:userId/profile')
  @ApiOperation({ summary: 'Get user profile settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile settings',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid user id' })
  async getUserProfile(
    @Param('userId') userId: string,
  ): Promise<UserProfileDto | null> {
    return await this.settingService.getUserSettingsByCategory<UserProfileDto>(
      userId,
      SettingCategory.USER_PROFILE,
    );
  }

  @Put('user/:userId/profile')
  @ApiOperation({ summary: 'Update user profile settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserSetting,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() profileDto: UserProfileDto,
  ): Promise<UserSetting> {
    return await this.settingService.updateUserSettings(userId, {
      category: SettingCategory.USER_PROFILE,
      settings: profileDto,
    });
  }

  @Get('user/:userId/company')
  @ApiOperation({ summary: 'Get company information settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Company information settings',
    type: CompanyInfoDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid user id' })
  async getCompanyInfo(
    @Param('userId') userId: string,
  ): Promise<CompanyInfoDto | null> {
    return await this.settingService.getUserSettingsByCategory<CompanyInfoDto>(
      userId,
      SettingCategory.COMPANY_INFO,
    );
  }

  @Put('user/:userId/company')
  @ApiOperation({ summary: 'Update company information settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Company information updated successfully',
    type: UserSetting,
  })
  @ApiResponse({ status: 400, description: 'Validation error or invalid ABN' })
  async updateCompanyInfo(
    @Param('userId') userId: string,
    @Body() companyDto: CompanyInfoDto,
  ): Promise<UserSetting> {
    return await this.settingService.updateUserSettings(userId, {
      category: SettingCategory.COMPANY_INFO,
      settings: companyDto,
    });
  }

  @Get('user/:userId/billing')
  @ApiOperation({ summary: 'Get billing address settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Billing address settings',
    type: BillingAddressDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid user id' })
  async getBillingAddress(
    @Param('userId') userId: string,
  ): Promise<BillingAddressDto | null> {
    return await this.settingService.getUserSettingsByCategory<BillingAddressDto>(
      userId,
      SettingCategory.BILLING_ADDRESS,
    );
  }

  @Put('user/:userId/billing')
  @ApiOperation({ summary: 'Update billing address settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Billing address updated successfully',
    type: UserSetting,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async updateBillingAddress(
    @Param('userId') userId: string,
    @Body() billingDto: BillingAddressDto,
  ): Promise<UserSetting> {
    return await this.settingService.updateUserSettings(userId, {
      category: SettingCategory.BILLING_ADDRESS,
      settings: billingDto,
    });
  }

  @Get('user/:userId/all')
  @ApiOperation({ summary: 'Get all user settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'All user settings',
    schema: {
      type: 'object',
      properties: {
        userProfile: { $ref: '#/components/schemas/UserProfileDto' },
        companyInfo: { $ref: '#/components/schemas/CompanyInfoDto' },
        billingAddress: { $ref: '#/components/schemas/BillingAddressDto' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid user id' })
  async getAllUserSettings(@Param('userId') userId: string): Promise<{
    userProfile: UserProfileDto | null;
    companyInfo: CompanyInfoDto | null;
    billingAddress: BillingAddressDto | null;
  }> {
    return await this.settingService.getAllUserSettings(userId);
  }

  @Delete('user/:userId/category/:category')
  @ApiOperation({ summary: 'Delete user settings by category' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({
    name: 'category',
    enum: SettingCategory,
    description: 'Setting category',
  })
  @ApiResponse({ status: 204, description: 'Settings deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid user id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserSettingsByCategory(
    @Param('userId') userId: string,
    @Param('category') category: SettingCategory,
  ): Promise<void> {
    await this.settingService.deleteUserSettingsByCategory(userId, category);
  }

  @Delete('user/:userId/all')
  @ApiOperation({ summary: 'Delete all user settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 204,
    description: 'All settings deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid user id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllUserSettings(@Param('userId') userId: string): Promise<void> {
    await this.settingService.deleteAllUserSettings(userId);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Initialize default settings' })
  @ApiResponse({
    status: 204,
    description: 'Default settings initialized successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async seedDefaultSettings(): Promise<void> {
    await this.settingService.seedDefaultSettings();
  }

  @Get('frontend/profile/:userId')
  @ApiOperation({ summary: 'Get user profile settings (frontend compatible)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile settings',
    type: UserProfileDto,
  })
  async getProfileForFrontend(
    @Param('userId') userId: string,
  ): Promise<UserProfileDto | null> {
    return await this.settingService.getUserSettingsByCategory<UserProfileDto>(
      userId,
      SettingCategory.USER_PROFILE,
    );
  }

  @Put('frontend/profile/:userId')
  @ApiOperation({
    summary: 'Update user profile settings (frontend compatible)',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserSetting,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async updateProfileForFrontend(
    @Param('userId') userId: string,
    @Body() profileDto: UserProfileDto,
  ): Promise<UserSetting> {
    return await this.settingService.updateUserSettings(userId, {
      category: SettingCategory.USER_PROFILE,
      settings: profileDto,
    });
  }
}
