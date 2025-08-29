import { randomEmail } from './common';

// ============================================================================
// User Dynamic Mock Data Generators - For integration tests
// ============================================================================

/**
 * Generate a random User DTO for integration tests
 */
export function createMockUserDto(overrides: Partial<any> = {}) {
  return {
    email: randomEmail(),
    password: 'testpassword123',
    role: 'user',
    status: 'active',
    ...overrides,
  };
}

/**
 * Generate multiple random User DTOs
 */
export function createMockUserDtos(
  count: number,
  overrides: Partial<any> = {},
) {
  return Array.from({ length: count }, () => createMockUserDto(overrides));
}
