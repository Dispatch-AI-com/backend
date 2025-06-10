import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  CallLogStatus,
  DEFAULT_CALLLOG_STATUS,
} from '@/common/constants/calllog.constant';

export class CreateCallLogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serviceBookedId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  callerNumber!: string;

  @ApiPropertyOptional({ enum: CallLogStatus, default: DEFAULT_CALLLOG_STATUS })
  @IsEnum(CallLogStatus)
  @IsOptional()
  status?: CallLogStatus = DEFAULT_CALLLOG_STATUS;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startAt!: Date;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endAt?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  audioId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summary?: string;
}
