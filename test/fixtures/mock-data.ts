import { Types } from 'mongoose';

// Mock ObjectIds - consistent across test runs
export const mockObjectIds = {
  userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
  calllogId: new Types.ObjectId('507f1f77bcf86cd799439012'),
  transcriptId: new Types.ObjectId('507f1f77bcf86cd799439013'),
  chunkId1: new Types.ObjectId('507f1f77bcf86cd799439014'),
  chunkId2: new Types.ObjectId('507f1f77bcf86cd799439015'),
  nonExistentId: new Types.ObjectId('507f1f77bcf86cd799439999'),
};

// Mock CallLog data
export const mockCallLog = {
  _id: mockObjectIds.calllogId,
  callSid: 'CA1234567890abcdef1234567890abcdef',
  userId: mockObjectIds.userId.toString(),
  serviceBookedId: 'test-service',
  callerNumber: '1234567890',
  callerName: 'Test User',
  startAt: new Date('2023-01-01T00:00:00.000Z'),
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  updatedAt: new Date('2023-01-01T00:00:00.000Z'),
};

// Mock Transcript data
export const mockTranscript = {
  _id: mockObjectIds.transcriptId,
  callSid: mockCallLog.callSid,
  summary: 'Test summary for transcript',
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  updatedAt: new Date('2023-01-01T00:00:00.000Z'),
};

// Mock TranscriptChunk data
export const mockTranscriptChunks = [
  {
    _id: mockObjectIds.chunkId1,
    transcriptId: mockObjectIds.transcriptId,
    speakerType: 'AI' as const,
    text: 'Hello, this is AI.',
    startAt: 0,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },
  {
    _id: mockObjectIds.chunkId2,
    transcriptId: mockObjectIds.transcriptId,
    speakerType: 'User' as const,
    text: 'Hi, this is user.',
    startAt: 61,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },
];

// Mock DTO data for creating chunks
export const mockCreateChunkDto = {
  speakerType: 'AI' as const,
  text: 'Hello, this is AI.',
  startAt: 0,
};

export const mockCreateMultipleChunksDto = [
  {
    speakerType: 'AI' as const,
    text: 'Hello, this is AI.',
    startAt: 0,
  },
  {
    speakerType: 'User' as const,
    text: 'Hi, this is user.',
    startAt: 61,
  },
];

export const mockCreateDuplicateChunksDto = [
  {
    speakerType: 'AI' as const,
    text: 'First chunk',
    startAt: 100,
  },
  {
    speakerType: 'User' as const,
    text: 'Second chunk with same start time',
    startAt: 100, // Duplicate startAt
  },
];

// Mock User data
export const mockUser = {
  _id: mockObjectIds.userId,
  email: 'test@example.com',
  role: 'user',
  status: 'active',
};

// Query parameters for testing
export const mockQueryParams = {
  speakerType: 'AI',
  startAt: 0,
  page: 1,
  limit: 20,
};

// Expected pagination response
export const mockPaginationResponse = {
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};