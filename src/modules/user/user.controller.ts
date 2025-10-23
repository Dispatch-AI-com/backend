//src/modules/user/user.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AllowSelfOrAdmin } from '@/common/decorators/ownership.decorator';
import { OwnershipGuard } from '@/common/guards/ownership.guard';

import { AddressDto } from './dto/address.dto';
import { GreetingDto } from './dto/greeting.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { User } from './schema/user.schema';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), OwnershipGuard)
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
  @AllowSelfOrAdmin()
  @ApiOperation({ summary: 'Patch a user by ID' })
  @ApiResponse({ status: 200, description: 'User updated', type: User })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not owner or admin',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async patch(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.users.patch(id, dto);
  }

  @Patch(':id/address')
  @ApiOperation({ summary: 'Update user billing address' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid userId or address data.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateAddress(
    @Param('id') userId: string,
    @Body() address: AddressDto,
  ): Promise<User> {
    return this.users.updateAddress(userId, address);
  }

  @Get(':id/address')
  @ApiOperation({ summary: 'Get user billing address' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Address retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getAddress(@Param('id') userId: string): Promise<AddressDto> {
    const address = await this.users.getAddress(userId);
    if (!address) {
      throw new Error('Address not found.');
    }
    return address;
  }

  @Patch(':id/greeting')
  @ApiOperation({ summary: 'Update user greeting message' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Greeting updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid userId or greeting data.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateGreeting(
    @Param('id') userId: string,
    @Body() greeting: GreetingDto,
  ): Promise<User> {
    return this.users.updateGreeting(userId, greeting);
  }

  @Get(':id/greeting')
  @ApiOperation({ summary: 'Get user greeting message' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Greeting retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getGreeting(@Param('id') userId: string): Promise<GreetingDto> {
    const greeting = await this.users.getGreeting(userId);
    if (!greeting) {
      throw new Error('Greeting not found.');
    }
    return greeting;
  }

  @Delete(':id')
  @AllowSelfOrAdmin()
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not owner or admin',
  })
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<User> {
    return this.users.delete(id);
  }
}
