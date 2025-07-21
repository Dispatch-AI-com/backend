import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteSessionDto {
  @ApiProperty({
    description: 'User ID of the onboarding session to delete',
    example: '64e9b4f2c1234567890abcde',
  })
  @IsString()
  userId!: string;
}
