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
    example: 'company.businessName',
    description: 'The business field this answer should be written to',
  })
  @IsString()
  field!: string;
}
