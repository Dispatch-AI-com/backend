import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UserStatus } from '@/modules/user/enum/userStatus.enum';

@Injectable()
export class StatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (user === undefined || user === null) {
      return false;
    }

    if (user.status === UserStatus.banned) {
      throw new ForbiddenException('User account is banned');
    }

    if (user.status !== UserStatus.active) {
      throw new ForbiddenException('User account is not active');
    }

    return true;
  }
}
