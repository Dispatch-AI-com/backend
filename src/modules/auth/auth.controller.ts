import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from '@/modules/auth/auth.service';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { User } from '@/modules/user/schema/user.schema';

@ApiTags('auth')
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: 'User Registration', description: 'Create a new user account' })
  @ApiBody({ 
    type: CreateUserDto,
    examples: {
      signupExample: {
        value: {
          "name": "Test User",
          "email": "test@example.com",
          "password": "Test123!",
          "role": "user"
        },
        summary: 'Registration Example'
      }
    }
  })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid password or email' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('signup')
  async createUser(@Body() CreateUserDto: CreateUserDto): Promise<User> {
    const user: User = await this.authService.createUser(CreateUserDto);
    return user;
  }


  @ApiOperation({ summary: 'User Login', description: 'Login with email and password' })
  @ApiBody({ 
    type: LoginDto,
    examples: {
      loginExample: {
        value: {
          "email": "test@example.com",
          "password": "Test123!"
        },
        summary: 'login example'
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Email or password is incorrect' })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<User> {
    const user: User = await this.authService.validateUser(loginDto.email, loginDto.password);
    return await this.authService.login(user);
  }
}
