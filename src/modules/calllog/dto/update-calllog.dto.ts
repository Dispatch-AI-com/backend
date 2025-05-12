import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { CallLogStatus } from '@/common/constants/calllog.constant';

export class UpdateCallLogDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  serviceBookedId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  callerNumber?: string;

  @ApiPropertyOptional({ enum: CallLogStatus })
  @IsEnum(CallLogStatus)
  @IsOptional()
  status?: CallLogStatus;

  @ApiPropertyOptional()
  @IsISO8601()
  @IsOptional()
  startAt?: string;

  @ApiPropertyOptional()
  @IsISO8601()
  @IsOptional()
  endAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  recordingUrl?: string;
}
