//src/modules/user/dto/UpdateUser.dto.ts
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import { CreateUserDto } from '@/modules/auth/dto/signup.dto';

import { AddressDto } from './address.dto';
import { GreetingDto } from './greeting.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'User full phone number',
    example: '+61412345678',
  })
  @IsOptional()
  @IsString()
  fullPhoneNumber?: string;

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
