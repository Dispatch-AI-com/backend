import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { SettingCategory } from '../schema/setting.schema';

export class CreateSettingDto {
  @ApiProperty({
    description: 'Unique key for the setting',
    example: 'user.profile.name',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    description: 'Value of the setting',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiProperty({
    description: 'Category of the setting',
    enum: SettingCategory,
    enumName: 'SettingCategory',
  })
  @IsEnum(SettingCategory)
  category!: SettingCategory;

  @ApiPropertyOptional({
    description: 'Description of the setting',
    example: 'User display name',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
