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
  callSid!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serviceBookedId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  callerNumber!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  callerName?: string;

  @ApiPropertyOptional({ enum: CallLogStatus, default: DEFAULT_CALLLOG_STATUS })
  @IsEnum(CallLogStatus)
  @IsOptional()
  status?: CallLogStatus = DEFAULT_CALLLOG_STATUS;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startAt!: Date;
}
