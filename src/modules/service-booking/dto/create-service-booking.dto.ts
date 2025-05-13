import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class CreateServiceBookingDto {
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @ValidateNested()
  @Type(() => ClientDto)
  client!: ClientDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FormValueDto)
  serviceFormValues!: FormValueDto[];

  @IsDateString()
  bookingTime!: Date;

  @IsEnum(['pending', 'confirmed', 'done'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  note?: string;
}