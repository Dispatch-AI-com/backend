import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class AnswerDto {
  @ApiProperty({ example: 'abc123', description: 'User ID' })
  @IsString()
  userId!: string;

  @ApiProperty({ example: 2, description: 'Current step ID' })
  @IsNumber()
  stepId!: number;

  @ApiProperty({ example: 'Kenves', description: 'User answer for the step' })
  @IsString()
  answer!: string;

  @ApiProperty({
    example: 'user.fullPhoneNumber',
    description:
      'The user field this answer should be written to (e.g., user.fullPhoneNumber, user.position, user.address.full, user.greeting.type, user.greeting.message)',
  })
  @IsString()
  field!: string;
}
