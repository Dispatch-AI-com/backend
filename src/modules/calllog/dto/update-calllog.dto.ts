import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

import { CallLogStatus } from '@/common/constants/calllog.constant';

export class UpdateCallLogDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serviceBookedId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  callerNumber?: string;

  @ApiPropertyOptional({ enum: CallLogStatus })
  @IsString()
  @IsOptional()
  status?: CallLogStatus;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  startAt?: Date;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  endAt?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recordingUrl?: string;
}
