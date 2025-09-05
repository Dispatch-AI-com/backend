import { Types } from 'mongoose';

// ============================================================================
// Common Static Mock Data - Shared across all modules
// ============================================================================

// Mock ObjectIds - consistent across test runs
export const mockObjectIds = {
  userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
  calllogId: new Types.ObjectId('507f1f77bcf86cd799439012'),
  transcriptId: new Types.ObjectId('507f1f77bcf86cd799439013'),
  chunkId1: new Types.ObjectId('507f1f77bcf86cd799439014'),
  chunkId2: new Types.ObjectId('507f1f77bcf86cd799439015'),
  serviceBookingId: new Types.ObjectId('507f1f77bcf86cd799439019'),
  serviceBookingId2: new Types.ObjectId('507f1f77bcf86cd799439020'),
  serviceBookingId3: new Types.ObjectId('507f1f77bcf86cd799439021'),
  nonExistentId: new Types.ObjectId('507f1f77bcf86cd799439999'),
};

// Common test dates
export const testDates = {
  baseDate: new Date('2023-01-01T00:00:00.000Z'),
  futureDate: new Date('2025-01-01T00:00:00.000Z'),
};

// Common test strings
export const testStrings = {
  callSid: 'CA1234567890abcdef1234567890abcdef',
  userId: 'test-user',
  serviceId: 'test-service',
  phoneNumber: '1234567890',
  email: 'test@example.com',
};
