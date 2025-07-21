import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { OwnershipGuard } from '../guards/ownership.guard';

/**
 * 需要用户身份验证和资源所有权验证的装饰器
 * 用于保护用户特定资源，防止越权访问
 *
 * 使用场景：
 * - 访问用户的通话记录、订阅信息等私人数据
 * - Admin用户可以访问所有资源
 * - 普通用户只能访问自己的资源
 */
export function RequireOwnership(): ClassDecorator & MethodDecorator {
  return applyDecorators(UseGuards(AuthGuard('jwt'), OwnershipGuard));
}
