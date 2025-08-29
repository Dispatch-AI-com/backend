import { randomBytes } from 'crypto';

// ============================================================================
// Common Dynamic Mock Data Utilities - Shared across all modules
// ============================================================================

/**
 * Generate a random number within a specified range
 */
export function generateRandomNumber(max: number): number {
  const range = Math.floor(65536 / max) * max;
  let randomValue;
  do {
    randomValue = randomBytes(2).readUInt16BE(0);
  } while (randomValue >= range);
  return randomValue % max;
}

/**
 * Generate a random date within a specified range
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

/**
 * Generate a random string of specified length
 */
export function randomString(length: number): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a random phone number
 */
export function randomPhoneNumber(): string {
  return '+6140000' + generateRandomNumber(10000).toString().padStart(4, '0');
}

/**
 * Generate a random email address
 */
export function randomEmail(): string {
  return `user${generateRandomNumber(1000)}@example.com`;
}
