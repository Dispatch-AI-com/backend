import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '@/modules/user/schema/user.schema';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
  status: string;
  tokenRefreshTime: number; // 签发时的refresh time (timestamp)
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthJwtService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      status: user.status,
      tokenRefreshTime: user.tokenRefreshTime.getTime(),
    };

    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }
}
