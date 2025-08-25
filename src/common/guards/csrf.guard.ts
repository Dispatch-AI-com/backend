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

    // Double submit pattern: require CSRF token in both cookie and header
    const csrfTokenFromHeader = request.headers['x-csrf-token'] as string;
    const csrfTokenFromCookie = request.cookies.csrfToken as string;

    // Both cookie and header must be present
    if (!csrfTokenFromHeader) {
      throw new ForbiddenException(
        'CSRF token is required in X-CSRF-Token header',
      );
    }

    if (!csrfTokenFromCookie) {
      throw new ForbiddenException('CSRF token cookie is required');
    }

    // Both tokens must be valid
    if (!validateCSRFToken(csrfTokenFromHeader)) {
      throw new ForbiddenException('Invalid CSRF token in header');
    }

    if (!validateCSRFToken(csrfTokenFromCookie)) {
      throw new ForbiddenException('Invalid CSRF token in cookie');
    }

    // Both tokens must match (double submit validation)
    if (csrfTokenFromHeader !== csrfTokenFromCookie) {
      throw new ForbiddenException('CSRF tokens do not match');
    }

    return true;
  }
}
