//src/modules/user/user.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schema/user.schema';
import { UpdateUserDto } from './dto/UpdateUser.dto';

import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users', type: [User] })
  async findAll(): Promise<User[]> {
    return this.users.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 400, description: 'Invalid user id' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.users.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch a user by ID' })
  @ApiResponse({ status: 200, description: 'User updated', type: User })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async patch(
    @Param('id') id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.users.patch(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<User> {
    return this.users.delete(id);
  }
}
