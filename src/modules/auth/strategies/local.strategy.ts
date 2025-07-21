import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '@/modules/auth/auth.service';
import { User } from '@/modules/user/schema/user.schema';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', 
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    try {
      const { user } = await this.authService.login({ email, password });
      return user;
    } catch {
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}
