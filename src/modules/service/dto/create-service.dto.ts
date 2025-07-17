import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class NotificationDto {
  @ApiPropertyOptional({
    description: 'Preferred notification type',
    example: 'SMS',
    enum: ['SMS', 'EMAIL', 'BOTH'],
  })
  @IsOptional()
  @IsString()
  preferNotificationType?: 'SMS' | 'EMAIL' | 'BOTH';

  @ApiPropertyOptional({
    description: 'Phone number for notifications',
    example: '09123456789',
  })
  @ValidateIf(
    o =>
      o.preferNotificationType === 'SMS' || o.preferNotificationType === 'BOTH',
  )
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Email for notifications',
    example: 'user@example.com',
  })
  @ValidateIf(
    o =>
      o.preferNotificationType === 'EMAIL' ||
      o.preferNotificationType === 'BOTH',
  )
  @IsString()
  email?: string;
}

export class CreateServiceDto {
  @ApiProperty({ description: 'Service name', example: 'AI Agent Service' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'AI Agent Service',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Service price', example: 100 })
  @IsNumber()
  price!: number;

  @ApiPropertyOptional({
    description: 'Notification settings',
    type: NotificationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationDto)
  notifications?: NotificationDto;

  @ApiPropertyOptional({
    description: 'Whether the service is available',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ description: 'User ID', example: 'userId123' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
