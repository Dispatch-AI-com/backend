import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTwilioPhoneNumberDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber!: string;
}
