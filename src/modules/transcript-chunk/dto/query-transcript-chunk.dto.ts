import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

import { SPEAKER_TYPE } from '../../../common/constants/transcript-chunk.constant';

export class QueryTranscriptChunkDto {
  @ApiPropertyOptional({
    enum: SPEAKER_TYPE,
    description: 'Filter by speaker type',
  })
  @IsOptional()
  @IsEnum(SPEAKER_TYPE)
  speakerType?: 'AI' | 'User';

  @ApiPropertyOptional({ description: 'Start time in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  startAt?: number;

  @ApiPropertyOptional({ description: 'End time in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  endAt?: number;

  @ApiPropertyOptional({ description: 'Page number (1-based)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
