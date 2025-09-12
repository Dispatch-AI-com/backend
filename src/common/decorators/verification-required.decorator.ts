import { SetMetadata } from '@nestjs/common';

export const VERIFICATION_REQUIRED_KEY = 'verificationRequired';

export const VerificationRequired = (): MethodDecorator =>
  SetMetadata(VERIFICATION_REQUIRED_KEY, true);
