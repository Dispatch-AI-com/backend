import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtUserDto } from '../dto/jwt-user.dto';
import { UserStatus } from '@/modules/user/enum/userStatus.enum';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  status: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract JWT from httpOnly cookie instead of Authorization header
        (request: Request): string | null => {
          const token = request.cookies.authToken;
          return typeof token === 'string' ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'your_jwt_secret',
    });
  }

  validate(payload: JwtPayload): JwtUserDto {
    if (payload.status === UserStatus.banned) {
      throw new UnauthorizedException('User account is banned');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      status: payload.status,
    };
  }
}
