import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTranscriptDto {
  @ApiProperty({
    description: 'Call SID from Twilio',
    example: 'CA1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  callSid!: string;

  @ApiProperty({
    description: 'Summary of the call transcript',
    example: 'Lee requests emergency repair after hailstorm...',
  })
  @IsString()
  @IsNotEmpty()
  summary!: string;

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
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];
}
