import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
}

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

  @ApiProperty({ description: 'Calendar provider', enum: CalendarProvider, default: CalendarProvider.GOOGLE })
  @IsEnum(CalendarProvider)
  @IsOptional()
  provider?: CalendarProvider = CalendarProvider.GOOGLE;

  @ApiProperty({ description: 'Calendar ID', required: false })
  @IsString()
  @IsOptional()
  calendarId?: string;
}
