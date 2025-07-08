import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
class AddressDto {
  @ApiPropertyOptional({ description: 'Unit/Apartment/PO Box' })
  @IsOptional()
  @IsString({ message: 'Unit/Apt/PO Box must be a string' })
  unitAptPOBox?: string;

  @ApiProperty({ description: 'Street address' })
  @IsString({ message: 'Street address must be a string' })
  @IsNotEmpty({ message: 'Street address cannot be empty' })
  streetAddress!: string;

  @ApiProperty({ description: 'Suburb' })
  @IsString({ message: 'Suburb must be a string' })
  @IsNotEmpty({ message: 'Suburb cannot be empty' })
  suburb!: string;

  @ApiProperty({ description: 'State' })
  @IsString({ message: 'State must be a string' })
  @IsNotEmpty({ message: 'State cannot be empty' })
  state!: string;

  @ApiProperty({ description: 'Postcode' })
  @IsString({ message: 'Postcode must be a string' })
  @IsNotEmpty({ message: 'Postcode cannot be empty' })
  postcode!: string;
}
export class CreateCompanyDto {
  @ApiProperty({ description: 'Business name of the company' })
  @IsString({ message: 'Business name must be a string' })
  @IsNotEmpty({ message: 'Business name cannot be empty' })
  businessName!: string;

  @ApiProperty({ description: 'Job title in the company' })
  @IsString({ message: 'Job title must be a string' })
  @IsNotEmpty({ message: 'Job title cannot be empty' })
  jobTitle!: string;

  @ApiProperty({ description: 'Company address', type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty({ message: 'Address cannot be empty' })
  address!: AddressDto;

  @ApiProperty({ description: 'Company email' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @ApiProperty({ description: 'Company phone number' })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  number!: string;

  @ApiProperty({ description: 'User ID reference' })
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  user!: string;
}
