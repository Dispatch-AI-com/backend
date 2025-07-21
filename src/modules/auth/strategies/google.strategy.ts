import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import {
  Strategy,
  StrategyOptions,
  VerifyCallback,
} from 'passport-google-oauth20';

import { EUserRole } from '@/common/constants/user.constant';
import { AuthJwtService } from '@/modules/auth/services/jwt.service';
import { User, UserDocument } from '@/modules/user/schema/user.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authJwtService: AuthJwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') ?? '',
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
          tokenRefreshTime: new Date(),
        });
        await user.save();
      } else if (user.googleId == null) {
        user.googleId = googleUser.googleId;
        user.avatar = googleUser.avatar;
        user.provider = 'google';
        await user.save();
      }

      // Ensure tokenRefreshTime exists for existing Google users
      if (user.tokenRefreshTime == null) {
        user.tokenRefreshTime = new Date();
        await user.save();
      }

      const token = this.authJwtService.generateToken(user);

      const result = { user: user.toObject() as User, token };
      done(null, result);
    } catch {
      done(new UnauthorizedException('Google authentication failed'), false);
    }
  }
}
