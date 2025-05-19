import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({
    description: 'The name of the location',
    example: 'Dispatch-AI',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'name cannot be empty' })
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({
    description: 'First address line (e.g., street address)',
    example: '123 Main St',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  address1?: string;

  @ApiPropertyOptional({
    description: 'Second address line (e.g., unit address)',
    example: 'Suite 500',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  address2?: string;

  @ApiProperty({
    description: 'City of the location',
    example: 'Adelaide',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  city!: string;

  @ApiProperty({
    description: 'State or province of the location',
    example: 'SA',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  state!: string;

  @ApiProperty({
    description: 'Country of the location',
    example: 'Australia',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  country!: string;

  @ApiPropertyOptional({
    description: 'Location embedding',
    example: [0.1, 0.2, 0.3],
    type: [Number],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  embedding?: number[];
}
