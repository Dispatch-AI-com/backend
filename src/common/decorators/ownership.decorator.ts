import { SetMetadata } from '@nestjs/common';

export const ALLOW_SELF_OR_ADMIN_KEY = 'allowSelfOrAdmin';

/**
 * AllowSelfOrAdmin Decorator
 * 
 * Marks endpoints that require owner or administrator permissions.
 * Must be used in conjunction with OwnershipGuard.
 * 
 * @example
 * ```typescript
 * @Patch(':id')
 * @AllowSelfOrAdmin()
 * async updateUser(@Param('id') id: string) {
 *   // Only the user themselves or an administrator can access
 * }
 * ```
 */
export const AllowSelfOrAdmin = () => SetMetadata(ALLOW_SELF_OR_ADMIN_KEY, true);

