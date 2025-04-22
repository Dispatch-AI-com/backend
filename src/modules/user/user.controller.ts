//src/modules/user/user.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Put, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schema/user.schema';
import { UpdateUserDto } from './dto/UpdateUser.dto';

import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(private readonly users: UserService) { }

    @Get()
    @ApiOperation({ summary: 'Get all users' })
    async findAll(): Promise<User[]> {
        return this.users.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a user by ID' })
    async findOne(@Param('id') id: string): Promise<User> {
        return this.users.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a user by ID' })
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
        return this.users.update(id, updateUserDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Patch a user by ID' })
    async patch(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
        return this.users.patch(id, updateUserDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user by ID' })
    @HttpCode(204)
    async delete(@Param('id') id: string): Promise<User> {
        return this.users.delete(id);
    }

}
