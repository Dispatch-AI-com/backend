import { IsString, IsNotEmpty } from 'class-validator';

export class SpeakDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
