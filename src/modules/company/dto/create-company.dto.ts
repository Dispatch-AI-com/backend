import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Business name of the company',
    example: 'ACME Ltd.',
  })
  @IsString({ message: 'Business name must be a string' })
  @IsNotEmpty({ message: 'Business name cannot be empty' })
  businessName!: string;

  @ApiProperty({
    description: 'Company email',
    example: 'info@acme.com',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @ApiProperty({
    description: 'Company ABN',
    example: '12345678901',
  })
  @IsString({ message: 'ABN must be a string' })
  @IsNotEmpty({ message: 'ABN cannot be empty' })
  abn!: string;

  @ApiProperty({
    description: 'User ID reference (Mongo ObjectId)',
    example: '6640e7330fdebe50da1a05f1',
  })
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  user!: string;
}
