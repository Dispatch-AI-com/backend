import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTranscriptDto {
  @ApiProperty({
    description: 'Summary of the call transcript',
    example: 'Lee requests emergency repair after hailstorm...',
  })
  @IsString()
  @IsNotEmpty()
  summary!: string;
}
