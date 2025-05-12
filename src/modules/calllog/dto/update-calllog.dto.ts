import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startAt?: Date;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endAt?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  recordingUrl?: string;
}
