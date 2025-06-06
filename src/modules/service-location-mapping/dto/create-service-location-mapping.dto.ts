import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceLocationMappingDto {
  @ApiProperty({ description: 'Service ID', example: 'serviceId123' })
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ description: 'Location ID', example: 'locationId123' })
  @IsString()
  @IsNotEmpty()
  locationId!: string;
}
