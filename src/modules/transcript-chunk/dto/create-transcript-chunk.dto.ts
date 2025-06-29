import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

import { SPEAKER_TYPE } from '../../../common/constants/transcript-chunk.constant';

export class CreateTranscriptChunkDto {
  @ApiProperty({ enum: SPEAKER_TYPE, description: 'Speaker type (AI or User)' })
  @IsEnum(SPEAKER_TYPE)
  speakerType!: 'AI' | 'User';

  @ApiProperty({ description: 'Text content of the chunk' })
  @IsString()
  text!: string;

  @ApiProperty({ description: 'Start time in seconds' })
  @IsNumber()
  @Min(0)
  startAt!: number;
}
