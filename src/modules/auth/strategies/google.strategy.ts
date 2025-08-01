import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import {
  Strategy,
  StrategyOptions,
  VerifyCallback,
} from 'passport-google-oauth20';

import { EUserRole } from '@/common/constants/user.constant';
import { User, UserDocument } from '@/modules/user/schema/user.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL: `${configService.get<string>('CALLBACK_URL') ?? 'http://localhost:4000/api'}/auth/google/callback`,
      scope: ['email', 'profile'],
    } as StrategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      name: { givenName: string; familyName: string };
      emails: { value: string }[];
      photos: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const { id, name, emails, photos } = profile;

      const googleUser = {
        googleId: id,
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        avatar: photos[0].value,
      };

      let user = await this.userModel.findOne({
        $or: [{ email: googleUser.email }, { googleId: googleUser.googleId }],
      });

      if (!user) {
        user = new this.userModel({
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          googleId: googleUser.googleId,
          avatar: googleUser.avatar,
          provider: 'google',
          role: EUserRole.user,
        });
        await user.save();
      } else if (user.googleId == null) {
        user.googleId = googleUser.googleId;
        user.avatar = googleUser.avatar;
        user.provider = 'google';
        await user.save();
      }

      const token = this.jwtService.sign({
        sub: user._id,
        email: user.email,
        role: user.role,
      });

      const result = { user: user.toObject() as User, token };
      done(null, result);
    } catch {
      done(new UnauthorizedException('Google authentication failed'), false);
    }
  }
}
