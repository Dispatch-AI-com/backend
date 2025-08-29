import { generateRandomNumber } from './common';

// ============================================================================
// Transcript Dynamic Mock Data Generators - For integration tests
// ============================================================================

/**
 * Generate a random Transcript DTO for integration tests
 */
export function createMockTranscriptDto(overrides: Partial<any> = {}) {
  return {
    summary:
      'Test summary for dynamic transcript ' + generateRandomNumber(1000),
    keyPoints: [
      'Key point 1 for dynamic test',
      'Key point 2 for dynamic test',
      'Key point 3 for dynamic test',
    ],
    ...overrides,
  };
}

/**
 * Generate a random TranscriptChunk DTO for integration tests
 */
export function createMockTranscriptChunkDto(overrides: Partial<any> = {}) {
  return {
    speakerType: Math.random() > 0.5 ? 'AI' : 'User',
    text: 'Dynamic test text ' + generateRandomNumber(1000),
    startAt: generateRandomNumber(3600), // 0-3600 seconds
    ...overrides,
  };
}

/**
 * Generate multiple random TranscriptChunk DTOs
 */
export function createMockTranscriptChunkDtos(
  count: number,
  overrides: Partial<any> = {},
) {
  return Array.from({ length: count }, () =>
    createMockTranscriptChunkDto(overrides),
  );
}
