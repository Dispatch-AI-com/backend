import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @IsDateString()
  @Type(() => Date)
  startDate!: Date;

  @IsString()
  @IsNotEmpty()
  repeatRule!: string; // e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,…"

  @IsString()
  startTime!: string; // "09:00"

  @IsString()
  endTime!: string; // "17:00"

  @IsBoolean()
  @IsOptional()
  isAvailable = true;
}
