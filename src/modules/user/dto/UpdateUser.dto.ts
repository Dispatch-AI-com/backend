//src/modules/user/dto/UpdateUser.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { CreateUserDto } from '@/modules/auth/dto/signup.dto';

import { AddressDto } from './address.dto';
import { GreetingDto } from './greeting.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'User billing address',
    type: AddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'User greeting message',
    type: GreetingDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GreetingDto)
  greeting?: GreetingDto;
}
