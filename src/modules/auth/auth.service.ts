import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';

import { EUserRole } from '@/common/constants/user.constant';
import { SALT_ROUNDS } from '@/modules/auth/auth.config';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';
import { User, UserDocument } from '@/modules/user/schema/user.schema';
import { GoogleCalendarAuthService } from '@/modules/user/google-calendar-auth.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly googleCalendarAuthService: GoogleCalendarAuthService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password ?? '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    return user.toObject() as User;
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const foundUser = await this.userModel
      .findOne({ email: loginDto.email })
      .select('+password');
    if (!foundUser) {
      throw new UnauthorizedException('Username or Password Not Match');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      foundUser.password ?? '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username or Password Not Match');
    }
    const user = foundUser.toObject({ virtuals: false });
    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
    return { user, token };
  }

  async createUser(
    userData: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    if (await this.checkUserExists(userData.email)) {
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const nameParts = userData.name ? userData.name.split(' ') : [''];
    const secureUserData = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: userData.email,
      password: hashedPassword,
      role: userData.role ?? EUserRole.user,
    };

    const newUser = new this.userModel(secureUserData);
    await newUser.save();

    const token = this.jwtService.sign({
      sub: newUser._id,
      email: newUser.email,
      role: newUser.role,
    });
    return { user: newUser.toObject() as User, token };
  }

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email });
    return !!user;
  }

  async validateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  }): Promise<{ user: User; token: string }> {
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

    return { user: user.toObject() as User, token };
  }

  async handleGoogleCallback(code: string, userId: string) {
    const tokenResponse = await this.exchangeCodeForTokens(code);
    
    await this.googleCalendarAuthService.upsertAuth(
      userId,
      tokenResponse.access_token,
      tokenResponse.refresh_token,
      new Date(Date.now() + tokenResponse.expires_in * 1000)
    );
    
    return { success: true };
  }

  async generateGoogleAuthUrl(userId?: string): Promise<string> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    const scope = 'https://www.googleapis.com/auth/calendar';
    
    let authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    if (userId) {
      authUrl += `&state=${userId}`;
    }
    
    return authUrl;
  }

  async refreshGoogleToken(userId: string) {
    const auth = await this.googleCalendarAuthService.getAuthByUserId(userId);
    if (!auth || !auth.refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    const tokenResponse = await this.refreshAccessToken(auth.refreshToken);
    
    await this.googleCalendarAuthService.upsertAuth(
      userId,
      tokenResponse.access_token,
      auth.refreshToken,
      new Date(Date.now() + tokenResponse.expires_in * 1000)
    );
    
    return { success: true, expiresIn: tokenResponse.expires_in };
  }

  private async exchangeCodeForTokens(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri!,
      }),
    });
    
    if (!response.ok) {
      throw new UnauthorizedException('Failed to exchange code for tokens');
    }
    
    return response.json();
  }

  private async refreshAccessToken(refreshToken: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!response.ok) {
      throw new UnauthorizedException('Failed to refresh access token');
    }
    
    return response.json();
  }
}
