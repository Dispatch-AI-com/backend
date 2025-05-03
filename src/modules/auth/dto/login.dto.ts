import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsEmail({}, { message: "please enter valid email" })
  @IsNotEmpty({ message: "email cannot be empty" })
  email!: string;

  @ApiProperty({
    description: "User password",
    example: "strongPassword123",
    minLength: 6,
  })
  @IsNotEmpty({ message: "password cannot be empty" })
  @MinLength(6, { message: "password need to be more than 6 words" })
  password!: string;
}
