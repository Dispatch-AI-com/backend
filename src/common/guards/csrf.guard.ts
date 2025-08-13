import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

import { validateCSRFToken } from '@/utils/csrf.util';

@Injectable()
export class CSRFGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip CSRF validation for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    const csrfToken = request.headers['x-csrf-token'] as string;

    if (!csrfToken) {
      throw new ForbiddenException('CSRF token is required');
    }

    if (!validateCSRFToken(csrfToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
