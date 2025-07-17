import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateTranscriptChunkDto {
  @ApiPropertyOptional({
    description: 'Type of speaker',
    enum: ['AI', 'User'],
    example: 'AI',
  })
  @ValidateIf(o => o.speakerType !== undefined)
  @IsEnum(['AI', 'User'])
  speakerType?: 'AI' | 'User';

  @ApiPropertyOptional({
    description: 'Text content of the chunk',
    example: 'Hello, how can I help you today?',
  })
  @ValidateIf(o => o.text !== undefined)
  @IsString()
  @IsNotEmpty()
  text?: string;

  @ApiPropertyOptional({
    description: 'Start time of the chunk in seconds',
    example: 0,
    minimum: 0,
  })
  @ValidateIf(o => o.startAt !== undefined)
  @IsNumber()
  @Min(0)
  startAt?: number;
}
