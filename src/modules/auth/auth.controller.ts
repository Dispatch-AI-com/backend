import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request, Response } from 'express';

import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';
import { UserResponseDto } from '@/modules/auth/dto/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'User Registration',
    description: 'Create a new user account',
  })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      signupExample: {
        value: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test123!',
          role: 'user',
        },
        summary: 'Registration Example',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid password or email',
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('signup')
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const { user, token } = await this.authService.createUser(createUserDto);
    const safeUser = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
    return { user: safeUser, token };
  }

  @ApiOperation({
    summary: 'User Login',
    description: 'Login with email and password',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      loginExample: {
        value: {
          email: 'test@example.com',
          password: 'Test123!',
        },
        summary: 'login example',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Email or password is incorrect' })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const { user, token } = await this.authService.login(loginDto);

    const safeUser: UserResponseDto = {
      _id: String(user._id),
      email: String(user.email),
      firstName: user.firstName ? String(user.firstName) : undefined,
      lastName: user.lastName ? String(user.lastName) : undefined,
      role: user.role,
    };
    return { user: safeUser, token };
  }

  @ApiOperation({
    summary: 'Google OAuth Login',
    description: 'Initiate Google OAuth authentication',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(@Req() _req: Request): void {
    // Guard redirects to Google
  }

  @ApiOperation({
    summary: 'Google OAuth Callback',
    description: 'Handle Google OAuth callback',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with auth data',
  })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request, @Res() res: Response): void {
    const { user, token, googleAccessToken, googleRefreshToken } = req.user as {
      user: Record<string, unknown>;
      token: string;
      googleAccessToken: string;
      googleRefreshToken: string;
    };

    // Redirect to frontend with token
    const frontendUrl = process.env.APP_URL ?? 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}&googleAccessToken=${googleAccessToken}&googleRefreshToken=${googleRefreshToken}`,
    );
  }

  @ApiOperation({
    summary: 'Generate Google OAuth URL',
    description: 'Generate OAuth authorization URL for Google Calendar',
  })
  @ApiResponse({ status: 200, description: 'OAuth URL generated' })
  @Post('google/authorize')
  async generateGoogleAuthUrl(): Promise<{ authUrl: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    const scope = 'https://www.googleapis.com/auth/calendar';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    return { authUrl };
  }

  @ApiOperation({
    summary: 'Handle Google OAuth Callback',
    description: 'Process OAuth callback and save tokens',
  })
  @ApiResponse({ status: 200, description: 'OAuth callback processed' })
  @Post('google/callback')
  async handleGoogleCallback(@Body() body: { code: string; userId?: string }) {
    try {
      // 如果没有提供 userId，尝试从 JWT 中获取
      let userId = body.userId;
      
      if (!userId) {
        // 这里需要从当前用户的 JWT 中获取 userId
        // 或者通过其他方式确定用户身份
        throw new BadRequestException('userId is required');
      }
      
      // 调用 service 处理授权码
      const result = await this.authService.handleGoogleCallback(body.code, userId);
      return result;
    } catch (error) {
      throw new BadRequestException(`Failed to process Google callback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @ApiOperation({
    summary: 'Link Google Account',
    description: 'Link existing user account with Google',
  })
  @ApiResponse({ status: 200, description: 'Google account linked' })
  @UseGuards(AuthGuard('jwt'))
  @Post('link-google-account')
  async linkGoogleAccount(@Req() req: Request) {
    const userId = (req.user as any).userId;
    // 生成授权 URL 并返回
    const authUrl = await this.authService.generateGoogleAuthUrl(userId);
    return { authUrl };
  }

  @ApiOperation({
    summary: 'Refresh Google Access Token',
    description: 'Refresh expired access token using refresh token',
  })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @UseGuards(AuthGuard('jwt'))
  @Post('google/refresh-token')
  async refreshGoogleToken(@Req() req: Request) {
    const userId = (req.user as any).userId;
    const result = await this.authService.refreshGoogleToken(userId);
    return result;
  }
}
