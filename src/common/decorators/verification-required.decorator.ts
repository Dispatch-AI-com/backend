import { SetMetadata } from '@nestjs/common';

export const VERIFICATION_REQUIRED_KEY = 'verificationRequired';

export const VerificationRequired = () => SetMetadata(VERIFICATION_REQUIRED_KEY, true);
