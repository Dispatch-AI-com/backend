import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request, Response } from 'express';

import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';
import { UserResponseDto } from '@/modules/auth/dto/user-response.dto';
import { AuthJwtService } from '@/modules/auth/services/jwt.service';
import { User } from '@/modules/user/schema/user.schema';
import { UserService } from '@/modules/user/user.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authJwtService: AuthJwtService,
    private readonly userService: UserService,
  ) {}

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
  @UseGuards(AuthGuard('local'))
  // eslint-disable-next-line @typescript-eslint/require-await
  async login(
    @Req() req: Request & { user: User },
  ): Promise<{ user: UserResponseDto; token: string }> {
    const user = req.user;
    const token = this.authJwtService.generateToken(user);

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
    const { user, token } = req.user as {
      user: User;
      token: string;
    };

    const safeUser: UserResponseDto = {
      _id: String(user._id),
      email: String(user.email),
      firstName: user.firstName ? String(user.firstName) : undefined,
      lastName: user.lastName ? String(user.lastName) : undefined,
      role: user.role,
    };

    // Redirect to frontend with token
    const frontendUrl = process.env.APP_URL ?? 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`,
    );
  }

  @ApiOperation({
    summary: 'User Logout',
    description: 'Logout user and invalidate tokens',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @Req() req: Request & { user: { userId: string } },
  ): Promise<{ message: string }> {
    // 使当前用户的所有token失效
    await this.userService.invalidateUserTokens(req.user.userId);
    return { message: 'Logged out successfully' };
  }

  @ApiOperation({
    summary: 'Get Current User',
    description: 'Get current authenticated user information',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: UserResponseDto,
  })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(
    @Req() req: Request & { user: { userId: string } },
  ): Promise<UserResponseDto> {
    const user = await this.userService.findOne(req.user.userId);
    return {
      _id: String(user._id),
      email: String(user.email),
      firstName: user.firstName ? String(user.firstName) : undefined,
      lastName: user.lastName ? String(user.lastName) : undefined,
      role: user.role,
    };
  }
}
