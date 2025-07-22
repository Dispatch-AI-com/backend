export class JwtUserDto {
  userId!: string;
  email!: string;
  role!: string;
  googleAccessToken?: string;
}
