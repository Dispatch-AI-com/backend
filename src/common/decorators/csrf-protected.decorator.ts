import { UseGuards } from '@nestjs/common';

import { CSRFGuard } from '@/common/guards/csrf.guard';

export const CSRFProtected = (): ReturnType<typeof UseGuards> =>
  UseGuards(CSRFGuard);
