import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTranscriptDto {
  @ApiProperty({
    description: 'Summary of the call transcript',
    example: 'Lee requests emergency repair after hailstorm...',
  })
  @IsString()
  @IsNotEmpty()
  summary!: string;
}
