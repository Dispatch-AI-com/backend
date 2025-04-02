import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  IsOptional,
  IsIn,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';

export class PriceOptionDto{
  @IsString()
  @IsIn(['MONTHLY', 'QUARTERLY', 'YEARLY'])
  billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @IsNumber({}, { message: 'monthlyPayment must be a non-negative numeric value' })
  monthlyPayment: number;
}
export class CreatePlanDto{
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description: string;

  @IsString()
  @IsNotEmpty()
  tier: string;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'trialDays must be a non-negative numeric value' })
  trialDays?: number;

  @IsOptional()
  features?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceOptionDto)
  @ArrayMinSize(1)
  pricing: PriceOptionDto[];
}