import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { EUserRole } from '@/common/constants/user.constant';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // JWT Strategy解析后的用户信息
    const params = request.params;

    // 获取URL中的userId参数
    const targetUserId = params.userId;

    if (targetUserId === undefined || targetUserId === null) {
      // 如果没有userId参数，允许访问（不是用户特定的资源）
      return true;
    }

    // Admin用户可以访问所有资源
    if (user.role === EUserRole.admin) {
      return true;
    }

    // 用户只能访问自己的资源
    if (user.userId === targetUserId) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have permission to access this resource',
    );
  }
}
