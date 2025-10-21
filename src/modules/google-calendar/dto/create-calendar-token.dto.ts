import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

// Single-provider (google) for now

export class CreateCalendarTokenDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Access token' })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;

  @ApiProperty({ description: 'Token expiration time (ISO8601)' })
  @IsDateString()
  @IsNotEmpty()
  expiresAt!: string;

  @ApiProperty({ description: 'Token type' })
  @IsString()
  @IsNotEmpty()
  tokenType!: string;

  @ApiProperty({ description: 'Scope' })
  @IsString()
  @IsNotEmpty()
  scope!: string;

  @ApiProperty({ description: 'Calendar ID', required: false })
  @IsString()
  @IsOptional()
  calendarId?: string;

  // 用户信息字段
  @ApiProperty({ description: 'Google User ID', required: false })
  @IsString()
  @IsOptional()
  googleUserId?: string;

  @ApiProperty({ description: 'User Email', required: false })
  @IsString()
  @IsOptional()
  userEmail?: string;

  @ApiProperty({ description: 'User Name', required: false })
  @IsString()
  @IsOptional()
  userName?: string;

  @ApiProperty({ description: 'User Picture URL', required: false })
  @IsString()
  @IsOptional()
  userPicture?: string;
}
