import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { EUserRole } from '@/common/constants/user.constant';

export const ALLOW_SELF_OR_ADMIN_KEY = 'allowSelfOrAdmin';

/**
 * OwnershipGuard - Authorization Guard
 * 
 * Ensures that only the account owner or administrators can access protected resources.
 * 
 * Usage:
 * 1. Add @UseGuards(AuthGuard('jwt'), OwnershipGuard) at the Controller level
 * 2. Add @AllowSelfOrAdmin() decorator to methods that require permission checks
 * 
 * Access Rules:
 * - Administrators (admin role) can access any user's resources
 * - Regular users can only access their own resources (user._id === params.id)
 * - Other cases return 403 Forbidden
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if this guard is required (marked by @AllowSelfOrAdmin decorator)
    const requireOwnership = this.reflector.getAllAndOverride<boolean>(
      ALLOW_SELF_OR_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If the method is not marked with @AllowSelfOrAdmin, skip the check
    if (!requireOwnership) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const currentUser = request.user; // User information from JWT strategy validation
    const targetUserId = request.params.id; // User ID from URL parameters

    // Rule 1: Administrators can access any resource
    if (currentUser.role === EUserRole.admin) {
      return true;
    }

    // Rule 2: Users can access their own resources
    if (currentUser._id === targetUserId) {
      return true;
    }

    // Neither admin nor resource owner, deny access
    throw new ForbiddenException(
      'You do not have permission to access this resource',
    );
  }
}

