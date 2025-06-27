import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class UpdateTranscriptChunkDto {
  @ApiPropertyOptional({
    description: 'Type of speaker',
    enum: ['AI', 'User'],
    example: 'AI',
  })
  @IsOptional()
  @ValidateIf((o) => o.speakerType !== undefined)
  @IsDefined()
  @IsEnum(['AI', 'User'])
  speakerType?: 'AI' | 'User';

  @ApiPropertyOptional({
    description: 'Text content of the chunk',
    example: 'Hello, how can I help you today?',
  })
  @IsOptional()
  @ValidateIf((o) => o.text !== undefined)
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  text?: string;

  @ApiPropertyOptional({
    description: 'Start time of the chunk in seconds',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @ValidateIf((o) => o.startAt !== undefined)
  @IsDefined()
  @IsNumber()
  @Min(0)
  startAt?: number;
}
