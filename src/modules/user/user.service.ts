import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { isValidObjectId } from 'mongoose';

import { SALT_ROUNDS } from '@/modules/auth/auth.config';

import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UserStatus } from './enum/userStatus.enum';
import { User, UserDocument } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<User[]> {
    const users = await this.userModel.find().exec();
    return users;
  }

  async findOne(id: string): Promise<User> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid user id: ${id}`);
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
  }

  async patch(id: string, dto: UpdateUserDto): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const updateFields = Object.entries(dto).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        if (value !== undefined && value !== '') acc[key] = value;
        return acc;
      },
      {},
    );

    if (typeof updateFields.email === 'string') {
      const exists = await this.userModel
        .findOne({ email: updateFields.email, _id: { $ne: id } })
        .exec();
      if (exists) {
        throw new ConflictException(
          `Email ${updateFields.email} already exists`,
        );
      }
    }

    if (typeof updateFields.password === 'string') {
      updateFields.password = await bcrypt.hash(
        updateFields.password,
        SALT_ROUNDS,
      );
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: updateFields },
        {
          new: true,
          runValidators: true,
          context: 'query',
        },
      )
      .exec();

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async delete(id: string): Promise<User> {
    const deleted = await this.userModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`User with id ${id} not found`);
    return deleted;
  }

  // Token失效机制
  async invalidateUserTokens(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { tokenRefreshTime: new Date() },
      { new: true },
    );
  }

  // 封禁用户
  async banUser(userId: string, reason?: string): Promise<User> {
    await this.invalidateUserTokens(userId);
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        status: UserStatus.banned,
        statusReason: reason,
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user;
  }

  // 激活用户
  async activateUser(userId: string): Promise<User> {
    await this.invalidateUserTokens(userId);
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        status: UserStatus.active,
        statusReason: undefined,
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user;
  }

  // 根据邮箱查找用户
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // 检查用户是否存在
  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    return !!user;
  }
}
