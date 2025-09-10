import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '@/modules/user/user.service';

export const VERIFICATION_REQUIRED_KEY = 'verificationRequired';

@Injectable()
export class VerificationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const verificationRequired = this.reflector.getAllAndOverride<boolean>(
      VERIFICATION_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!verificationRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user._id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user verification status
    const userData = await this.userService.findOne(user._id);
    
    if (!userData.emailVerified || !userData.phoneVerified) {
      throw new ForbiddenException('Email and phone verification required to access this feature');
    }

    return true;
  }
}
