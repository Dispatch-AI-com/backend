import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  stepId!: number;

  @IsNotEmpty()
  answer!: string;
}
