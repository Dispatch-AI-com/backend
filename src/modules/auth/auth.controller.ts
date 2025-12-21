import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { EUserRole } from '@/common/constants/user.constant';
import { SkipCSRF } from '@/common/decorators/skip-csrf.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';
import { UserResponseDto } from '@/modules/auth/dto/user-response.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import { UserStatus } from '@/modules/user/enum/userStatus.enum';
import { generateCSRFToken } from '@/utils/csrf.util';

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
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'Test123!',
        },
        summary: 'Basic Registration Example',
        description:
          'Signup with required fields only. Address and other details are collected during onboarding.',
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
  @SkipCSRF()
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserResponseDto; csrfToken: string }> {
    const { user, token, csrfToken } =
      await this.authService.createUser(createUserDto);

    // Manually construct safe user object to preserve ObjectId
    const safeUser: UserResponseDto = {
      _id: user._id?.toString() ?? '',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    };

    // Set JWT token as httpOnly cookie
    res.cookie('jwtToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Set CSRF token as httpOnly cookie for double submit pattern
    res.cookie('csrfToken', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return { user: safeUser, csrfToken };
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
  @SkipCSRF()
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserResponseDto; csrfToken: string }> {
    const { user, token, csrfToken } = await this.authService.login(loginDto);

    // Manually construct safe user object to preserve ObjectId
    const safeUser: UserResponseDto = {
      _id: user._id?.toString() ?? '',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    };

    // Set JWT token as httpOnly cookie
    res.cookie('jwtToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Set CSRF token as httpOnly cookie for double submit pattern
    res.cookie('csrfToken', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return { user: safeUser, csrfToken };
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
    const { user, token, csrfToken } = req.user as {
      user: Record<string, unknown>;
      token: string;
      csrfToken: string;
    };

    // Manually construct safe user object to preserve ObjectId
    const safeUser = {
      _id: user._id?.toString() ?? user._id,
      email: user.email ?? '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as EUserRole,
      status: user.status as UserStatus,
    };

    // Set JWT token as httpOnly cookie
    res.cookie('jwtToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Set CSRF token as httpOnly cookie for double submit pattern
    res.cookie('csrfToken', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Redirect to frontend with user data (CSRF token is in regular cookie)
    const frontendUrl = process.env.APP_URL ?? 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?user=${encodeURIComponent(JSON.stringify(safeUser))}&csrfToken=${encodeURIComponent(csrfToken)}`,
    );
  }

  @ApiOperation({
    summary: 'Forgot Password',
    description: 'Send a password reset link to the user\'s email',
  })
  @ApiResponse({ status: 200, description: 'If that email is registered, a reset link has been sent.' })
  @Post('forgot-password')
  @SkipCSRF()
  async forgotPassword(@Body('email') email: string): Promise<{ message: string }> {
    await this.authService.forgotPassword(email);
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  @ApiOperation({
    summary: 'User Logout',
    description: 'Logout and clear authentication cookies',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    // Clear the JWT token cookie
    res.clearCookie('jwtToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    // Clear the CSRF token cookie
    res.clearCookie('csrfToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    return { message: 'Logout successful' };
  }

  @ApiOperation({
    summary: 'Refresh CSRF Token',
    description: 'Generate a new CSRF token and update cookie',
  })
  @ApiResponse({ status: 200, description: 'CSRF token refreshed' })
  @ApiResponse({ status: 401, description: 'User is not authenticated' })
  @Post('refresh-csrf')
  @UseGuards(AuthGuard('jwt'))
  refreshCSRFToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): { message: string; csrfToken: string } {
    const newCsrfToken = generateCSRFToken();

    // Set new CSRF token as httpOnly cookie for double submit pattern
    res.cookie('csrfToken', newCsrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return {
      message: 'CSRF token refreshed successfully',
      csrfToken: newCsrfToken,
    };
  }

  @ApiOperation({
    summary: 'Get CSRF Token',
    description: 'Get current CSRF token from cookie',
  })
  @ApiResponse({ status: 200, description: 'CSRF token retrieved' })
  @ApiResponse({ status: 401, description: 'User is not authenticated' })
  @Get('csrf-token')
  @UseGuards(AuthGuard('jwt'))
  getCSRFToken(@Req() req: Request): { csrfToken: string } {
    const csrfToken = req.cookies.csrfToken as string;

    if (!csrfToken) {
      throw new ForbiddenException('CSRF token not found');
    }

    return { csrfToken };
  }

  @ApiOperation({
    summary: 'Check Authentication Status',
    description: 'Validate current authentication status',
  })
  @ApiResponse({ status: 200, description: 'User is authenticated' })
  @ApiResponse({ status: 401, description: 'User is not authenticated' })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(
    @Req() req: Request,
  ): Promise<{ user: UserResponseDto }> {
    const jwtUser = req.user as { _id: string };

    const fullUser = await this.authService.getUserById(jwtUser._id);

    // Manually construct safe user object to preserve ObjectId (same as Google OAuth)
    const safeUser: UserResponseDto = {
      _id: fullUser?._id?.toString() ?? '',
      email: fullUser?.email ?? '',
      firstName: fullUser?.firstName,
      lastName: fullUser?.lastName,
      role: fullUser?.role ?? EUserRole.user,
      status: fullUser?.status ?? UserStatus.active,
    };
    return { user: safeUser };
  }

  @ApiOperation({
    summary: 'Reset Password',
    description: 'Reset password using a valid reset token',
  })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid token or password' })
  @Post('reset-password')
  @SkipCSRF()
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto);
    return { message: 'Password reset successful' };
  }
}
