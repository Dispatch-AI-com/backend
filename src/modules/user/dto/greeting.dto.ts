import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GreetingDto {
  @ApiProperty({
    description: 'Greeting message',
    example: 'Hello! Thank you for contacting us.',
  })
  @IsString({ message: 'Greeting message must be a string' })
  @IsNotEmpty({ message: 'Greeting message cannot be empty' })
  @MaxLength(1000, {
    message: 'Greeting message cannot exceed 1000 characters',
  })
  message!: string;

  @ApiProperty({
    description: 'Whether the greeting is custom or default',
    example: false,
  })
  @IsBoolean({ message: 'isCustom must be a boolean' })
  isCustom!: boolean;
}
