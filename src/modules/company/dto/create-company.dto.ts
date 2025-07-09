import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Business name of the company' })
  @IsString({ message: 'Business name must be a string' })
  @IsNotEmpty({ message: 'Business name cannot be empty' })
  businessName!: string;

  @ApiProperty({ description: 'Job title in the company' })
  @IsString({ message: 'Job title must be a string' })
  @IsNotEmpty({ message: 'Job title cannot be empty' })
  jobTitle!: string;

  @ApiProperty({ description: 'Company address' })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address cannot be empty' })
  address!: string;

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
