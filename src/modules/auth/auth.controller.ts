import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';
import { User } from '@/modules/user/schema/user.schema';

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
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    const created = await this.authService.createUser(createUserDto);
    return created;
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
  async login(@Body() loginDto: LoginDto): Promise<User> {
    return this.authService.validateUser(loginDto.email, loginDto.password);
  }
}
