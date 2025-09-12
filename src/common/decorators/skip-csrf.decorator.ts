import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';
export const SkipCSRF = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(SKIP_CSRF_KEY, true);
