import { mockObjectIds, testDates, testStrings } from './common';

// ============================================================================
// Service Booking Static Mock Data - For unit tests
// ============================================================================

// Static Service Booking data for unit tests
export const staticServiceBooking = {
  _id: mockObjectIds.serviceBookingId,
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
    {
      serviceFieldId: 'field-2',
      answer: 'Test answer 2',
    },
  ],
  status: 'Confirmed',
  note: 'Test booking note',
  bookingTime: testDates.baseDate,
  userId: mockObjectIds.userId.toString(),
  callSid: testStrings.callSid,
  createdAt: testDates.baseDate,
  updatedAt: testDates.baseDate,
};

// Static Service Booking DTO for API tests
export const staticServiceBookingDto = {
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
    {
      serviceFieldId: 'field-2',
      answer: 'Test answer 2',
    },
  ],
  status: 'Confirmed' as const,
  note: 'Test booking note',
  bookingTime: testDates.baseDate,
  callSid: testStrings.callSid,
};

// Multiple service bookings for testing
export const staticServiceBookings = [
  staticServiceBooking,
  {
    ...staticServiceBooking,
    _id: mockObjectIds.serviceBookingId2,
    client: {
      name: 'Jane Smith',
      phoneNumber: '+1234567890',
      address: '456 Another Street, Another City',
    },
    status: 'Done',
    bookingTime: new Date('2025-01-15T10:00:00Z'),
  },
  {
    ...staticServiceBooking,
    _id: mockObjectIds.serviceBookingId3,
    client: {
      name: 'Bob Johnson',
      phoneNumber: '+9876543210',
      address: '789 Third Street, Third City',
    },
    status: 'Cancelled',
    bookingTime: new Date('2025-01-20T14:00:00Z'),
  },
];
