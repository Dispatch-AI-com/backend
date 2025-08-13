import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserStatus } from '@/modules/user/enum/userStatus.enum';

import { JwtUserDto } from '../dto/jwt-user.dto';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  status: UserStatus;
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
      _id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: payload.status,
    };
  }
}
