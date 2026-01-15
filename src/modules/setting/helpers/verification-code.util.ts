import { randomInt } from 'node:crypto';

import bcrypt from 'bcryptjs';

export interface VerificationCodeConfig {
  length?: number;
}

const DEFAULT_CODE_LENGTH = 6;
const SALT_ROUNDS = 10;

export function generateNumericCode(
  config: VerificationCodeConfig = {},
): string {
  const length = config.length ?? DEFAULT_CODE_LENGTH;
  if (length <= 0) {
    throw new Error('Verification code length must be greater than zero');
  }

  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return String(randomInt(min, max));
}

export async function hashVerificationCode(code: string): Promise<string> {
  return bcrypt.hash(code, SALT_ROUNDS);
}

export async function verifyVerificationCode(
  code: string,
  hashed: string,
): Promise<boolean> {
  if (!hashed) {
    return false;
  }
  return bcrypt.compare(code, hashed);
}
