import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startAt!: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  intent?: string;
}
