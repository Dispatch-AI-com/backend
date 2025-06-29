import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteDto {
  @ApiProperty({
    example: 'abc123',
    description: 'User ID of the onboarding session to mark as completed',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
