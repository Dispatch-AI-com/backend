import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddressDto {
  @ApiPropertyOptional({
    description: 'Unit / Apartment / PO Box',
    example: '12B',
  })
  @IsOptional()
  @IsString({ message: 'Unit/Apt/PO Box must be a string' })
  unitAptPOBox?: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 George St',
  })
  @IsString({ message: 'Street address must be a string' })
  @IsNotEmpty({ message: 'Street address cannot be empty' })
  streetAddress!: string;

  @ApiProperty({
    description: 'Suburb',
    example: 'Sydney',
  })
  @IsString({ message: 'Suburb must be a string' })
  @IsNotEmpty({ message: 'Suburb cannot be empty' })
  suburb!: string;

  @ApiProperty({
    description: 'State',
    example: 'NSW',
  })
  @IsString({ message: 'State must be a string' })
  @IsNotEmpty({ message: 'State cannot be empty' })
  state!: string;

  @ApiProperty({
    description: 'Postcode',
    example: '2000',
  })
  @IsString({ message: 'Postcode must be a string' })
  @IsNotEmpty({ message: 'Postcode cannot be empty' })
  postcode!: string;
}
