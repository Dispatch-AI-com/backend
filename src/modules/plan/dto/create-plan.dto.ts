import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class PricingDto {
  @ApiProperty({
    description: 'Billing frequency rule',
    example: 'FREQ=MONTHLY;INTERVAL=1',
  })
  @IsString()
  rrule!: string;

  @ApiProperty({
    description: 'Price in AUD for the given billing period',
    example: 49,
  })
  @IsNumber({}, { message: 'price must be a valid number' })
  price!: number;

  @IsString()
  stripePriceId!: string; 
}

export class FeaturesDto {
  @ApiProperty({
    description: 'Call minutes included in the plan',
    example: 'Unlimited',
  })
  @IsString()
  callMinutes!: string;

  @ApiProperty({
    description: 'Support level included in this plan',
    example: 'Priority support',
  })
  @IsString()
  support!: string;
}

export class CreatePlanDto {
  @ApiProperty({
    description: 'Plan name',
    example: 'Free Plan',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty({ message: 'name cannot be empty' })
  @MaxLength(20)
  name!: string;

  @ApiProperty({
    description: 'Plan tier',
    example: 'FREE',
    enum: ['FREE', 'BASIC', 'PRO'],
  })
  @IsEnum(['FREE', 'BASIC', 'PRO'], {
    message: 'tier must be one of: FREE, BASIC, or PRO',
  })
  tier!: 'FREE' | 'BASIC' | 'PRO';

  @ApiProperty({
    description: 'Pricing options with flexible billing using rrule format',
    example: [{ rrule: 'FREQ=MONTHLY;INTERVAL=1', price: 49 }],
    type: PricingDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingDto)
  pricing!: PricingDto[];

  @ApiProperty({
    description: 'Plan features',
    example: {
      callMinutes: 'Unlimited',
      support: 'Basic support',
    },
  })
  @IsNotEmpty({ message: 'features cannot be empty' })
  @ValidateNested()
  @Type(() => FeaturesDto)
  features!: FeaturesDto;

  @ApiPropertyOptional({
    description: 'Is the plan active or not',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
