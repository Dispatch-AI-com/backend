import { mockObjectIds, testDates, testStrings } from './common';

// ============================================================================
// CallLog Static Mock Data - For unit tests
// ============================================================================

// Static CallLog data for unit tests
export const staticCallLog = {
  _id: mockObjectIds.calllogId,
  callSid: testStrings.callSid,
  userId: mockObjectIds.userId.toString(),
  serviceBookedId: testStrings.serviceId,
  callerNumber: testStrings.phoneNumber,
  callerName: 'Test User',
  startAt: testDates.baseDate,
  createdAt: testDates.baseDate,
  updatedAt: testDates.baseDate,
};

// Static CallLog DTO for API tests
export const staticCallLogDto = {
  callSid: testStrings.callSid,
  userId: testStrings.userId,
  serviceBookedId: testStrings.serviceId,
  callerNumber: testStrings.phoneNumber,
  callerName: 'Test User',
  startAt: testDates.baseDate,
};
