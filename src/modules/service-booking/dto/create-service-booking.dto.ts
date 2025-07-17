import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ClientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;
}

export class FormValueDto {
  @IsString()
  @IsNotEmpty()
  serviceFieldId!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;
}

export enum ServiceBookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Done = 'done',
}

export class CreateServiceBookingDto {
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @ValidateNested()
  @Type(() => ClientDto)
  client!: ClientDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FormValueDto)
  serviceFormValues!: FormValueDto[];

  @IsDateString()
  bookingTime!: string;

  @Type(() => String)
  @IsEnum(ServiceBookingStatus)
  @IsOptional()
  status?: ServiceBookingStatus;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;
}
