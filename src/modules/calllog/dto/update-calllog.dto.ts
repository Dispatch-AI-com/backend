import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

import { CallLogStatus } from '@/common/constants/calllog.constant';

export class UpdateCallLogDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === undefined ? undefined : value)
  serviceBookedId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === undefined ? undefined : value)
  callerNumber?: string;

  @ApiPropertyOptional({ enum: CallLogStatus })
  @IsEnum(CallLogStatus)
  @IsOptional()
  @Transform(({ value }) => value === undefined ? undefined : value)
  status?: CallLogStatus;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }) => value === undefined ? undefined : value)
  startAt?: Date;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }) => value === undefined ? undefined : value)
  endAt?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === undefined ? undefined : value)
  audioId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === undefined ? undefined : value)
  summary?: string;
}
