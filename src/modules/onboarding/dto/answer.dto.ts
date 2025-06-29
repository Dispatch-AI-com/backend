import { ApiProperty } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({ example: 'abc123', description: 'User ID' })
  userId!: string;

  @ApiProperty({ example: 2, description: 'Current step ID' })
  stepId!: number;

  @ApiProperty({ example: 'Kenves', description: 'User answer for the step' })
  answer!: string;
}
