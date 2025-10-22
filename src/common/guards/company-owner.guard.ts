import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { EUserRole } from '@/common/constants/user.constant';
import { CompanyService } from '@/modules/company/company.service';

/**
 * Guard to verify that a user has access to a specific company resource.
 * Allows access if:
 * 1. User is an admin, OR
 * 2. User is the owner of the company (company.user === user._id)
 */
@Injectable()
export class CompanyOwnerGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private companyService: CompanyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user is authenticated
    if (!user || !user._id) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Admin users have access to all companies
    if (user.role === EUserRole.admin) {
      return true;
    }

    // Extract company ID from request params
    const companyId = request.params.id || request.params.companyId;
    const userId = request.params.userId;
    const email = request.params.email;

    // For endpoints that use userId parameter (e.g., GET /companies/user/:userId)
    if (userId) {
      // User can only access their own company via userId
      if (userId !== user._id.toString()) {
        throw new ForbiddenException(
          'You do not have permission to access this company',
        );
      }
      return true;
    }

    // For endpoints that use email parameter (e.g., GET /companies/email/:email)
    if (email) {
      // User can only access company by their own email
      if (email !== user.email) {
        throw new ForbiddenException(
          'You do not have permission to access this company',
        );
      }
      return true;
    }

    // For endpoints that use company ID
    if (companyId) {
      try {
        const company = await this.companyService.findOne(companyId);

        // Check if user owns this company
        const companyUserId =
          typeof company.user === 'string'
            ? company.user
            : company.user._id?.toString();

        if (companyUserId !== user._id.toString()) {
          throw new ForbiddenException(
            'You do not have permission to access this company',
          );
        }

        return true;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        if (error instanceof ForbiddenException) {
          throw error;
        }
        throw new ForbiddenException(
          'Unable to verify company ownership: ' + (error as Error).message,
        );
      }
    }

    // For POST /companies - user is creating a new company
    // Allow users to create companies (will be associated with their user ID)
    if (request.method === 'POST' && request.route.path === '/companies') {
      return true;
    }

    // For GET /companies - list all companies
    // This should be restricted by RolesGuard to admin only
    if (request.method === 'GET' && request.route.path === '/companies') {
      throw new ForbiddenException(
        'Only administrators can list all companies',
      );
    }

    // Default: deny access if we can't determine ownership
    throw new ForbiddenException(
      'Unable to determine company ownership for this request',
    );
  }
}


