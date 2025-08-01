import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateCallLogDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? undefined)
  serviceBookedId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? undefined)
  callerNumber?: string;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }: { value: Date | undefined }) => value ?? undefined)
  startAt?: Date;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }: { value: Date | undefined }) => value ?? undefined)
  endAt?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? undefined)
  audioId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) => value ?? undefined)
  summary?: string;
}
