import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class UpdateTranscriptDto {
  @ApiPropertyOptional({
    description: 'Summary of the call transcript',
    example: 'Lee requests emergency repair after hailstorm...',
  })
  @ValidateIf(o => o.summary !== undefined)
  @IsString()
  @IsNotEmpty()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Key points from the transcript',
    type: String,
    isArray: true,
    example: [
      "User Lee from Canada's warehouse needs room repair after hailstorm.",
      'Lee requests a booking for repair services.',
      'Suburb mentioned is Gungahlin, confirming service area.',
      'Sophiie offers to send a booking link for scheduling.',
      'User requests emergency assistance for a customer, advised to call emergency services.',
    ],
  })
  @ValidateIf(o => o.keyPoints !== undefined)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  keyPoints?: string[];
}
