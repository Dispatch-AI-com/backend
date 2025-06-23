import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

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
}
