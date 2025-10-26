import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { EUserRole } from '@/common/constants/user.constant';
import { AddressDto } from '@/modules/user/dto/address.dto';

export class CreateUserDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsNotEmpty({ message: 'First name cannot be empty' })
  @IsString({ message: 'First name must be a string' })
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsNotEmpty({ message: 'Last name cannot be empty' })
  @IsString({ message: 'Last name must be a string' })
  lastName!: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
    message: 'Password must contain at least one special character',
  })
  password!: string;

  @ApiPropertyOptional({
    description: 'User role',
    example: 'user',
    required: false,
    default: 'user',
  })
  @IsOptional()
  @IsEnum(EUserRole, { message: 'Invalid role' })
  role?: EUserRole;

  @ApiPropertyOptional({
    description: 'User job position/title',
    example: 'Web Developer',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Position must be a string' })
  position?: string;

  @ApiProperty({
    description: 'User billing address',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}
