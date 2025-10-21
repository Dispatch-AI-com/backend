import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator, ForbiddenException } from '@nestjs/common';

export const VerifyUserAccess = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as { _id: string } | undefined;

    if (!user?._id || user._id.trim() === '') {
      throw new ForbiddenException('User not authenticated');
    }

    return user._id;
  },
);

export const VerifyUserIdParam = createParamDecorator(
  (paramName: string, ctx: ExecutionContext): void => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as { _id: string } | undefined;
    const userId = request.params[paramName];

    if (!user?._id || user._id.trim() === '') {
      throw new ForbiddenException('User not authenticated');
    }

    if (user._id !== userId) {
      throw new ForbiddenException(
        `You can only access your own ${paramName === 'userId' ? 'user' : paramName} data`,
      );
    }
  },
);
