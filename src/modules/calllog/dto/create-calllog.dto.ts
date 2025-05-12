import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
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
  companyId!: string;

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
  @IsISO8601()
  startAt!: string;

  @ApiPropertyOptional()
  @IsISO8601()
  @IsOptional()
  endAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recordingUrl?: string;
}
