import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  createdBy!: { name: string; avatar: string };

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsDateString()
  dateTime!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
