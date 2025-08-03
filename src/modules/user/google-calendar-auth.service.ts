import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  GoogleCalendarAuth,
  GoogleCalendarAuthDocument,
} from './schema/google-calendar-auth.schema';

@Injectable()
export class GoogleCalendarAuthService {
  constructor(
    @InjectModel(GoogleCalendarAuth.name)
    private readonly googleCalendarAuthModel: Model<GoogleCalendarAuthDocument>,
  ) {}

  async getAuthByUserId(
    userId: Types.ObjectId | string,
  ): Promise<GoogleCalendarAuthDocument | null> {
    const userIdObj = this.validateAndSanitizeObjectId(userId);
    return this.googleCalendarAuthModel.findOne({ userId: userIdObj });
  }

  async upsertAuth(
    userId: Types.ObjectId | string,
    accessToken: string,
    refreshToken?: string,
    tokenExpiresAt?: Date,
  ): Promise<GoogleCalendarAuthDocument> {
    // 验证输入参数
    if (
      !accessToken ||
      typeof accessToken !== 'string' ||
      accessToken.trim() === ''
    ) {
      throw new BadRequestException(
        'Access token is required and must be a non-empty string',
      );
    }

    // 验证refreshToken（如果提供）
    if (
      refreshToken !== undefined &&
      (typeof refreshToken !== 'string' || refreshToken.trim() === '')
    ) {
      throw new BadRequestException(
        'Refresh token must be a non-empty string if provided',
      );
    }

    // 验证tokenExpiresAt（如果提供）
    if (tokenExpiresAt !== undefined && !(tokenExpiresAt instanceof Date)) {
      throw new BadRequestException(
        'Token expiration must be a valid Date if provided',
      );
    }

    const userIdObj = this.validateAndSanitizeObjectId(userId);

    // 构建安全的查询对象
    const query = { userId: userIdObj };
    const update = {
      accessToken: accessToken.trim(),
      ...(refreshToken && { refreshToken: refreshToken.trim() }),
      ...(tokenExpiresAt && { tokenExpiresAt }),
    };

    return this.googleCalendarAuthModel.findOneAndUpdate(query, update, {
      upsert: true,
      new: true,
    });
  }

  async deleteAuth(
    userId: Types.ObjectId | string,
  ): Promise<GoogleCalendarAuthDocument | null> {
    const userIdObj = this.validateAndSanitizeObjectId(userId);
    return this.googleCalendarAuthModel.findOneAndDelete({ userId: userIdObj });
  }

  async isAuthorized(userId: Types.ObjectId | string): Promise<boolean> {
    const auth = await this.getAuthByUserId(userId);
    if (!auth?.accessToken || auth.accessToken.trim() === '') return false;

    // 检查 token 是否过期
    if (auth.tokenExpiresAt && new Date() > auth.tokenExpiresAt) {
      return false;
    }

    return true;
  }

  private validateAndSanitizeObjectId(
    id: string | Types.ObjectId,
  ): Types.ObjectId {
    if (typeof id === 'string') {
      // 检查字符串长度和格式
      if (!id || id.trim() === '' || id.length !== 24) {
        throw new BadRequestException(
          'Invalid ObjectId format: invalid length',
        );
      }

      // 检查是否只包含有效的十六进制字符
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException(
          'Invalid ObjectId format: invalid characters',
        );
      }

      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(
          'Invalid ObjectId format: validation failed',
        );
      }

      // 创建新的ObjectId实例以确保安全
      return new Types.ObjectId(id);
    }

    // 验证ObjectId实例
    if (!(id instanceof Types.ObjectId)) {
      throw new BadRequestException('Invalid ObjectId instance');
    }

    // 验证ObjectId实例的有效性
    if (!Types.ObjectId.isValid(id.toString())) {
      throw new BadRequestException(
        'Invalid ObjectId instance validation failed',
      );
    }

    return id;
  }
}
