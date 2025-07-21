import { SetMetadata } from '@nestjs/common';

import type { EUserRole } from '@/common/constants/user.constant';

export const Roles = (...roles: EUserRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata('roles', roles);
