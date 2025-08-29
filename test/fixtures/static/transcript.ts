import { mockObjectIds, testDates, testStrings } from './common';

// ============================================================================
// Transcript Static Mock Data - For unit tests
// ============================================================================

// Static Transcript data for unit tests
export const staticTranscript = {
  _id: mockObjectIds.transcriptId,
  callSid: testStrings.callSid,
  summary: 'Test summary for transcript',
  keyPoints: [
    "User Lee from Canada's warehouse needs room repair after hailstorm.",
    'Lee requests a booking for repair services.',
    'Suburb mentioned is Gungahlin, confirming service area.',
    'Sophiie offers to send a booking link for scheduling.',
    'User requests emergency assistance for a customer, advised to call emergency services.',
  ],
  createdAt: testDates.baseDate,
  updatedAt: testDates.baseDate,
};

// Static TranscriptChunk data for unit tests
export const staticTranscriptChunks = [
  {
    _id: mockObjectIds.chunkId1,
    transcriptId: mockObjectIds.transcriptId,
    speakerType: 'AI' as const,
    text: 'Hello, this is AI.',
    startAt: 0,
    createdAt: testDates.baseDate,
    updatedAt: testDates.baseDate,
  },
  {
    _id: mockObjectIds.chunkId2,
    transcriptId: mockObjectIds.transcriptId,
    speakerType: 'User' as const,
    text: 'Hi, this is user.',
    startAt: 61,
    createdAt: testDates.baseDate,
    updatedAt: testDates.baseDate,
  },
];

// DTO data for creating transcript chunks
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
