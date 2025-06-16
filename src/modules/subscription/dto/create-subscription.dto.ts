import { IsMongoId, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsMongoId()
  planId!: string;

  @IsString()
  companyId!: string;
}
