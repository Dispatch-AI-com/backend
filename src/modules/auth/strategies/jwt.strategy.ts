import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserStatus } from '@/modules/user/enum/userStatus.enum';
import { UserService } from '@/modules/user/user.service';

import { JwtUserDto } from '../dto/jwt-user.dto';
import { JwtPayload } from '../services/jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'your_jwt_secret',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUserDto> {
    const user = await this.userService.findOne(payload.sub);

    if (user === null || user === undefined) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (user.status === UserStatus.banned) {
      throw new UnauthorizedException('User account is banned');
    }

    if (user.status !== UserStatus.active) {
      throw new UnauthorizedException('User account is not active');
    }

    if (payload.tokenRefreshTime < user.tokenRefreshTime.getTime()) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    return {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };
  }
}
