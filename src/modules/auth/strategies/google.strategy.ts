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
import { GoogleCalendarAuth, GoogleCalendarAuthDocument } from '@/modules/user/schema/google-calendar-auth.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(GoogleCalendarAuth.name) private readonly googleCalendarAuthModel: Model<GoogleCalendarAuthDocument>
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') ?? '',
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar'],
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
      console.log('Google OAuth callback received:', { 
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing',
        profileId: profile.id 
      });

      const { id, name, emails, photos } = profile;

      const googleUser = {
        googleId: id,
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        avatar: photos[0].value,
      };

      console.log('Processing Google user:', googleUser.email);

      let user = await this.userModel.findOne({
        $or: [{ email: googleUser.email }, { googleId: googleUser.googleId }],
      });

      if (!user) {
        console.log('Creating new user');
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
        console.log('Updating existing user with Google ID');
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

      console.log('Saving Google Calendar auth tokens');
      await this.googleCalendarAuthModel.findOneAndUpdate(
        { userId: user._id },
        { 
          accessToken, 
          refreshToken, 
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000) // 1小时后过期
        },
        { upsert: true, new: true }
      );

      const result = { 
        user: user.toObject() as User, 
        token
      };
      console.log('Google OAuth completed successfully');
      done(null, result);
    } catch (error) {
      console.error('Google OAuth error:', error);
      done(new UnauthorizedException('Google authentication failed'), false);
    }
  }
}
