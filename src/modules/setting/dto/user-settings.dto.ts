import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { SettingCategory } from '../schema/setting.schema';

export class UserProfileDto {
  @ApiProperty({ description: 'User name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty()
  contact!: string;

  @ApiProperty({ description: 'User role' })
  @IsString()
  @IsNotEmpty()
  role!: string;
}

export class CompanyInfoDto {
  @ApiProperty({
    description: 'Company name',
    example: 'ABC Company Pty Ltd',
  })
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @ApiProperty({
    description: 'Australian Business Number (11 digits)',
    example: '12345678901',
  })
  @IsString()
  @IsNotEmpty()
  abn!: string;
}

export class BillingAddressDto {
  @ApiPropertyOptional({
    description: 'Unit, apartment or PO Box number',
    example: 'Unit 5',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    description: 'Street address',
    example: '3-5 Underwood Road',
  })
  @IsString()
  @IsNotEmpty()
  streetAddress!: string;

  @ApiProperty({
    description: 'Suburb',
    example: 'Parramatta',
  })
  @IsString()
  @IsNotEmpty()
  suburb!: string;

  @ApiProperty({
    description: 'State',
    example: 'New South Wales',
  })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({
    description: 'Postcode',
    example: '2140',
  })
  @IsString()
  @IsNotEmpty()
  postcode!: string;
}

export class UpdateUserSettingsDto {
  @ApiProperty({
    description: 'Setting category',
    enum: SettingCategory,
    enumName: 'SettingCategory',
  })
  @IsEnum(SettingCategory)
  category!: SettingCategory;

  @ApiProperty({
    description: 'Settings data for the category',
    oneOf: [
      { $ref: '#/components/schemas/UserProfileDto' },
      { $ref: '#/components/schemas/CompanyInfoDto' },
      { $ref: '#/components/schemas/BillingAddressDto' },
    ],
  })
  @IsObject()
  @IsNotEmpty()
  settings!: UserProfileDto | CompanyInfoDto | BillingAddressDto;
}
