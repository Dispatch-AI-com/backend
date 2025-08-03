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

class AddressDto {
  @ApiPropertyOptional({
    description: 'Unit / Apartment / PO Box',
    example: '12B',
  })
  @IsOptional()
  @IsString({ message: 'Unit/Apt/PO Box must be a string' })
  unitAptPOBox?: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 George St',
  })
  @IsString({ message: 'Street address must be a string' })
  @IsNotEmpty({ message: 'Street address cannot be empty' })
  streetAddress!: string;

  @ApiProperty({
    description: 'Suburb',
    example: 'Sydney',
  })
  @IsString({ message: 'Suburb must be a string' })
  @IsNotEmpty({ message: 'Suburb cannot be empty' })
  suburb!: string;

  @ApiProperty({
    description: 'State',
    example: 'NSW',
  })
  @IsString({ message: 'State must be a string' })
  @IsNotEmpty({ message: 'State cannot be empty' })
  state!: string;

  @ApiProperty({
    description: 'Postcode',
    example: '2000',
  })
  @IsString({ message: 'Postcode must be a string' })
  @IsNotEmpty({ message: 'Postcode cannot be empty' })
  postcode!: string;
}
class GreetingDto {
  @ApiProperty({
    description: 'Greeting message',
    example: 'Hello! Thank you for contacting us.',
  })
  @IsString({ message: 'Greeting message must be a string' })
  @IsNotEmpty({ message: 'Greeting message cannot be empty' })
  @MaxLength(1000, {
    message: 'Greeting message cannot exceed 1000 characters',
  })
  message!: string;

  @ApiProperty({
    description: 'Whether the greeting is custom or default',
    example: false,
  })
  @IsBoolean({ message: 'isCustom must be a boolean' })
  isCustom!: boolean;
}

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Business name of the company',
    example: 'ACME Ltd.',
  })
  @IsString({ message: 'Business name must be a string' })
  @IsNotEmpty({ message: 'Business name cannot be empty' })
  businessName!: string;

  @ApiProperty({
    description: 'Company address',
    type: AddressDto,
    example: {
      unitAptPOBox: '12B',
      streetAddress: '123 George St',
      suburb: 'Sydney',
      state: 'NSW',
      postcode: '2000',
    },
  })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty({ message: 'Address cannot be empty' })
  address!: AddressDto;

  @ApiProperty({
    description: 'Company email',
    example: 'info@acme.com',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @ApiProperty({
    description: 'Company phone number',
    example: '+61 2 1234 5678',
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  number!: string;

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

  @ApiPropertyOptional({
    description: 'Company greeting message',
    type: GreetingDto,
    example: {
      message: 'Hello! Thank you for contacting us.',
      isCustom: false,
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GreetingDto)
  greeting?: GreetingDto;
}
