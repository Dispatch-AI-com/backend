//src/modules/user/user.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { EUserRole } from '@/common/constants/user.constant';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { StatusGuard } from '@/modules/auth/guards/status.guard';

import { UpdateUserDto } from './dto/UpdateUser.dto';
import { User } from './schema/user.schema';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), StatusGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get All Users',
    description: 'Get all users (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @Get()
  @UseGuards(RolesGuard)
  @Roles(EUserRole.admin)
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @ApiOperation({
    summary: 'Get User by ID',
    description: 'Get user by ID (Admin or self)',
  })
  @ApiResponse({ status: 200, description: 'User information' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string; role: EUserRole } },
  ): Promise<User> {
    // 只有管理员或用户本人可以查看用户信息
    if (req.user.role !== EUserRole.admin && req.user.userId !== id) {
      throw new Error('Forbidden');
    }
    return this.userService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update User',
    description: 'Update user information (Admin or self)',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request & { user: { userId: string; role: EUserRole } },
  ): Promise<User> {
    // 只有管理员或用户本人可以更新用户信息
    if (req.user.role !== EUserRole.admin && req.user.userId !== id) {
      throw new Error('Forbidden');
    }
    return this.userService.patch(id, updateUserDto);
  }

  @ApiOperation({
    summary: 'Delete User',
    description: 'Delete user (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(EUserRole.admin)
  async remove(@Param('id') id: string): Promise<User> {
    return this.userService.delete(id);
  }

  @ApiOperation({
    summary: 'Ban User',
    description: 'Ban a user (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @Post(':id/ban')
  @UseGuards(RolesGuard)
  @Roles(EUserRole.admin)
  async banUser(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ): Promise<User> {
    return this.userService.banUser(id, body.reason);
  }

  @ApiOperation({
    summary: 'Activate User',
    description: 'Activate a banned user (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @Post(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(EUserRole.admin)
  async activateUser(@Param('id') id: string): Promise<User> {
    return this.userService.activateUser(id);
  }

  @ApiOperation({
    summary: 'Invalidate User Tokens',
    description: 'Invalidate all tokens for a user (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Tokens invalidated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @Post(':id/invalidate-tokens')
  @UseGuards(RolesGuard)
  @Roles(EUserRole.admin)
  async invalidateTokens(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.userService.invalidateUserTokens(id);
    return { message: 'User tokens invalidated successfully' };
  }
}
