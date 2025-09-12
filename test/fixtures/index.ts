// ============================================================================
// Mock Data Unified Export - Provides clean API for all mock data
// ============================================================================

// Static mock data exports
export * from './static/calllog';
export * from './static/common';
export * from './static/setting';
export * from './static/calendar';
export * from './static/transcript';
export * from './static/user';


// Dynamic mock data generator exports
export * from './dynamic/calllog';
export * from './dynamic/common';
export * from './dynamic/setting';
export * from './dynamic/calendar';
export * from './dynamic/transcript';
export * from './dynamic/user';

// Convenient aliases for commonly used functions
export {
  createMockCallLogDto as createCallLog,
  createMockCallLogDtos as createCallLogs,
} from './dynamic/calllog';
export {
  createMockServiceBookingDto as createServiceBooking,
  createMockServiceBookings as createServiceBookings,
} from './dynamic/calendar';
export {
  createMockTranscriptChunkDto as createChunk,
  createMockTranscriptChunkDtos as createChunks,
  createMockTranscriptDto as createTranscript,
} from './dynamic/transcript';
export {
  createMockUserDto as createUser,
  createMockUserDtos as createUsers,
} from './dynamic/user';
