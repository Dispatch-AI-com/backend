import { randomBytes } from 'crypto';
import { generateRandomNumber, randomDate, randomPhoneNumber } from './common';

// ============================================================================
// CallLog Dynamic Mock Data Generators - For integration tests
// ============================================================================

/**
 * Generate a random CallLog DTO for integration tests
 */
export function createMockCallLogDto(overrides: Partial<any> = {}) {
  const startAt = randomDate(
    new Date('2025-01-01T00:00:00Z'),
    new Date('2025-01-10T23:59:59Z'),
  );
  const endAt = new Date(startAt.getTime() + 10 * 60 * 1000);

  return {
    callSid: 'CA' + randomBytes(16).toString('hex'),
    userId: 'user-' + generateRandomNumber(1000),
    serviceBookedId: 'booking-' + generateRandomNumber(1000),
    callerNumber: randomPhoneNumber(),
    callerName: 'User ' + generateRandomNumber(1000),
    startAt,
    endAt,
    ...overrides,
  };
}

/**
 * Generate multiple random CallLog DTOs
 */
export function createMockCallLogDtos(
  count: number,
  overrides: Partial<any> = {},
) {
  return Array.from({ length: count }, () => createMockCallLogDto(overrides));
}
