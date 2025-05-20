import { PartialType } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @IsOptional()
  @IsEmail()
  email?: string;
}
