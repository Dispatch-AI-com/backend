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
import { generateCSRFToken } from '@/utils/csrf.util';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    let clientID = configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
    let clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    let callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') ?? '';

    // In development, allow service to start without Google OAuth credentials
    if (
      (clientID === '' || clientSecret === '' || callbackURL === '') &&
      (process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === undefined)
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        '⚠️  Google OAuth credentials not found. Google OAuth features will be disabled.',
      );
      // Provide dummy values for development
      clientID = 'dummy_client_id';
      clientSecret = 'dummy_client_secret';
      callbackURL = 'http://localhost:4000/api/auth/google/callback';
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    } as StrategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      name?: { givenName?: string; familyName?: string };
      emails?: { value: string }[];
      photos?: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    try {
      // Validate profile data - profile.emails and profile.name are optional
      if (!profile.emails || profile.emails.length === 0 || !profile.name) {
        done(new UnauthorizedException('Invalid Google profile data'), false);
        return;
      }

      // At this point, we know profile.name and profile.emails exist and have items
      const { name, emails } = profile;

      const googleUser = {
        email: emails[0].value,
        firstName: name.givenName ?? '',
        lastName: name.familyName ?? '',
      };

      let user = await this.userModel.findOne({
        email: googleUser.email,
      });

      if (!user) {
        user = new this.userModel({
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          role: EUserRole.user,
        });
        await user.save();
      } else {
        // Update existing user with latest profile info
        user.firstName = googleUser.firstName;
        user.lastName = googleUser.lastName;
        await user.save();
      }

      const token = this.jwtService.sign({
        sub: user._id?.toString() ?? user._id, // Ensure ObjectId is converted to string
        email: user.email,
        role: user.role,
      });

      const csrfToken = generateCSRFToken();
      const result = { user: user.toObject() as User, token, csrfToken };
      done(null, result);
    } catch {
      done(new UnauthorizedException('Google authentication failed'), false);
    }
  }
}
