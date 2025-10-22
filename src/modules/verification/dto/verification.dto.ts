import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export enum VerificationType {
  SMS = 'SMS',
  EMAIL = 'Email',
  BOTH = 'Both',
}

export class UpdateVerificationDto {
  @IsEnum(VerificationType)
  type!: VerificationType;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  marketingPromotions?: boolean;

  @IsOptional()
  @IsBoolean()
  mobileVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}

export class SendEmailVerificationDto {
  @IsEmail()
  email!: string;
}

export class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  code!: string;
}

export class SendSmsVerificationDto {
  @IsString()
  mobile!: string;
}

export class VerifySmsDto {
  @IsString()
  mobile!: string;

  @IsString()
  code!: string;
}


