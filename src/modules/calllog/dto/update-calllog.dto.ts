import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

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
  audioId?: string;
}
