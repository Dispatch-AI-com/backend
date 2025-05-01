import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
    @ApiProperty({ description: 'Business name of the company' })
    @IsString()
    @IsNotEmpty()
    businessName: string;

    @ApiProperty({ description: 'Job title in the company' })
    @IsString()
    @IsNotEmpty()
    jobTitle: string;

    @ApiProperty({ description: 'Company address' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ description: 'Company email' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'User ID reference' })
    @IsString()
    @IsNotEmpty()
    user: string;
} 