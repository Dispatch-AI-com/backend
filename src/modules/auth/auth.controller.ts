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
import { plainToInstance } from 'class-transformer';
import { Request, Response } from 'express';

import { CSRFProtected } from '@/common/decorators/csrf-protected.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';
import { UserResponseDto } from '@/modules/auth/dto/user-response.dto';
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
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserResponseDto; csrfToken: string }> {
    const { user, token, csrfToken } =
      await this.authService.createUser(createUserDto);
    const safeUser = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    // Set JWT token as httpOnly cookie
    res.cookie('jwtToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Set CSRF token as httpOnly cookie
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
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: UserResponseDto; csrfToken: string }> {
    const { user, token, csrfToken } = await this.authService.login(loginDto);

    const safeUser = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    // Set JWT token as httpOnly cookie
    res.cookie('jwtToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Set CSRF token as httpOnly cookie
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

    // Set JWT token as httpOnly cookie
    res.cookie('jwtToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Set CSRF token as httpOnly cookie
    res.cookie('csrfToken', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Redirect to frontend with user data and csrfToken (JWT token is in httpOnly cookie)
    const frontendUrl = process.env.APP_URL ?? 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?user=${encodeURIComponent(JSON.stringify(user))}&csrfToken=${encodeURIComponent(csrfToken)}`,
    );
  }

  @ApiOperation({
    summary: 'User Logout',
    description: 'Logout and clear authentication cookies',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @Post('logout')
  @CSRFProtected()
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
  ): { message: string } {
    const newCsrfToken = generateCSRFToken();

    // Set new CSRF token as httpOnly cookie
    res.cookie('csrfToken', newCsrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return { message: 'CSRF token refreshed successfully' };
  }

  // CSRF tokens should not be exposed via API endpoints
  // They should only be available via httpOnly cookies

  @ApiOperation({
    summary: 'Check Authentication Status',
    description: 'Validate current authentication status',
  })
  @ApiResponse({ status: 200, description: 'User is authenticated' })
  @ApiResponse({ status: 401, description: 'User is not authenticated' })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getCurrentUser(@Req() req: Request): { user: UserResponseDto } {
    const user = req.user as UserResponseDto;
    return { user };
  }
}
