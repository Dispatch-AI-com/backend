import { mockObjectIds, testDates, testStrings } from '../static/common';

// ============================================================================
// Service Booking Dynamic Mock Data - For integration tests
// ============================================================================

export function createMockServiceBookingDto(overrides: any = {}) {
  return {
    serviceId: testStrings.serviceId,
    userId: mockObjectIds.userId.toString(),
    client: {
      name: 'John Doe',
      phoneNumber: testStrings.phoneNumber,
      address: '123 Test Street, Test City',
    },
    serviceFormValues: [
      {
        serviceFieldId: 'field-1',
        answer: 'Test answer 1',
      },
    ],
    status: 'Confirmed' as const,
    note: 'Test booking note',
    bookingTime: testDates.baseDate,
    callSid: testStrings.callSid,
    ...overrides,
  };
}

export function createMockServiceBooking(overrides: any = {}) {
  return {
    _id: mockObjectIds.serviceBookingId.toString(),
    serviceId: testStrings.serviceId,
    client: {
      name: 'John Doe',
      phoneNumber: testStrings.phoneNumber,
      address: '123 Test Street, Test City',
    },
    serviceFormValues: [
      {
        serviceFieldId: 'field-1',
        answer: 'Test answer 1',
      },
    ],
    status: 'Confirmed',
    note: 'Test booking note',
    bookingTime: testDates.baseDate,
    userId: mockObjectIds.userId.toString(),
    callSid: testStrings.callSid,
    createdAt: testDates.baseDate,
    updatedAt: testDates.baseDate,
    ...overrides,
  };
}

export function createMockServiceBookings(count = 3) {
  return Array.from({ length: count }, (_, index) =>
    createMockServiceBooking({
      _id: new (require('mongoose').Types.ObjectId)(),
      client: {
        name: `Client ${index + 1}`,
        phoneNumber: `+123456789${index}`,
        address: `${100 + index} Test Street, Test City`,
      },
      status: ['Confirmed', 'Done', 'Cancelled'][index % 3],
      bookingTime: new Date(
        testDates.baseDate.getTime() + index * 24 * 60 * 60 * 1000,
      ),
    }),
  );
}
