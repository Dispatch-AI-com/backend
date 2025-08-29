import { mockObjectIds, testDates, testStrings } from './common';

// ============================================================================
// User Static Mock Data - For unit tests
// ============================================================================

// Static User data for unit tests
export const staticUser = {
  _id: mockObjectIds.userId,
  email: testStrings.email,
  role: 'user',
  status: 'active',
  createdAt: testDates.baseDate,
  updatedAt: testDates.baseDate,
};

// Static User DTO for API tests
export const staticUserDto = {
  email: testStrings.email,
  password: 'testpassword123',
  role: 'user',
  status: 'active',
};
