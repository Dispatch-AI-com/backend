# Test Structure Documentation

## Overview

This directory contains all tests for the backend application, organized by test type and module.

## Directory Structure

```
test/
├── unit/                    # Unit tests - testing individual functions/classes
│   ├── health/             # Health check tests
│   ├── auth/               # Authentication tests
│   ├── user/               # User module tests
│   └── ...                 # Other module unit tests
├── integration/            # Integration tests - testing module interactions
│   ├── calllog/            # CallLog module integration tests
│   ├── transcript/         # Transcript module integration tests
│   ├── transcript-chunk/   # TranscriptChunk module integration tests
│   └── ...                 # Other module integration tests
├── e2e/                    # End-to-end tests - testing full API flows
│   ├── calllog/            # CallLog E2E tests
│   ├── transcript/         # Transcript E2E tests
│   └── ...                 # Other E2E tests
├── fixtures/               # Mock data and test utilities
│   ├── static/             # Static mock data
│   ├── dynamic/            # Dynamic mock data generators
│   └── index.ts            # Unified exports
├── helpers/                # Test helper utilities
│   └── database.helper.ts  # Database test utilities
└── setup.ts                # Global test setup and configuration
```

## Test Types

### Unit Tests (`test/unit/`)
- Test individual functions, classes, or services in isolation
- Use mocks for dependencies
- Fast execution
- Example: Testing a service method with mocked dependencies

### Integration Tests (`test/integration/`)
- Test module interactions and database operations
- Use real database connections
- Test API endpoints with mocked authentication
- Test individual endpoints or service interactions
- Example: Testing CRUD operations with real database

### End-to-End Tests (`test/e2e/`)
- Test complete user workflows from start to finish
- Use real database and external services
- Test full user journeys and complete workflows
- Example: Complete booking flow from user login to payment confirmation

## Test Type Examples

### Integration Test Example
```typescript
// test/integration/calllog/calllog.integration.test.ts
describe('CallLogController (integration)', () => {
  it('should create a new call log', async () => {
    const response = await request(app.getHttpServer())
      .post('/users/123/calllogs')
      .send(testData);
    
    expect(response.status).toBe(201);
  });
});
```

### E2E Test Example (Future)
```typescript
// test/e2e/booking/booking.e2e.test.ts
describe('Booking Flow (e2e)', () => {
  it('should complete full booking process', async () => {
    // 1. User login
    // 2. Service selection
    // 3. Date/time booking
    // 4. Payment processing
    // 5. Confirmation
  });
});
```

## Available Scripts

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit           # Unit tests only
pnpm test:integration    # Integration tests only
pnpm test:e2e           # E2E tests only

# Run with coverage
pnpm test:coverage

# Run CI tests (unit + coverage)
pnpm test:ci

# Lint tests
pnpm lint:test
```

## Test Patterns

### File Naming Convention
- Unit tests: `*.unit.test.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

### Current Test Files

**Unit Tests:**
- `test/unit/calllog/calllog.controller.unit.test.ts` - CallLog controller unit tests
- `test/unit/transcript/transcript.controller.unit.test.ts` - Transcript controller unit tests
- `test/unit/transcript-chunk/transcript-chunk.controller.unit.test.ts` - TranscriptChunk controller unit tests
- `test/unit/common/health.test.ts` - Health check unit tests
- `test/unit/common/ci.test.ts` - CI environment unit tests

**Integration Tests:**
- `test/integration/calllog/calllog.integration.test.ts` - CallLog API integration tests
- `test/integration/transcript/transcript.integration.test.ts` - Transcript API integration tests
- `test/integration/transcript-chunk/transcript-chunk.integration.test.ts` - TranscriptChunk API integration tests

### Module Organization
Each module should have its own directory under the appropriate test type:
```
test/integration/calllog/
├── calllog.integration.test.ts
└── calllog.service.integration.test.ts
```

## Mock Data Usage

### Static Data (for unit tests)
```typescript
import { staticCallLog, staticTranscript } from '../fixtures';

const testData = staticCallLog;
```

### Dynamic Data (for integration tests)
```typescript
import { createMockCallLogDto } from '../fixtures';

const testData = createMockCallLogDto({ userId: 'custom-user' });
```

## Database Testing

Use the `DatabaseTestHelper` for database operations:

```typescript
import { DatabaseTestHelper } from '../helpers/database.helper';

describe('CallLog Integration Tests', () => {
  let dbHelper: DatabaseTestHelper;

  beforeEach(async () => {
    await dbHelper.cleanupAll();
  });

  it('should create call log', async () => {
    const callLog = await dbHelper.createTestCallLog(testData);
    expect(callLog).toBeDefined();
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Database Cleanup**: Always clean up database state between tests
3. **Mock External Services**: Mock external API calls and services
4. **Descriptive Names**: Use descriptive test and describe block names
5. **Arrange-Act-Assert**: Structure tests with clear arrange, act, and assert sections
6. **Test Data**: Use fixtures for consistent test data across tests

## Adding New Tests

1. **Unit Tests**: Create `test/unit/{module-name}/` directory
2. **Integration Tests**: Create `test/integration/{module-name}/` directory
3. **E2E Tests**: Create `test/e2e/{module-name}/` directory
4. **Mock Data**: Add to appropriate `test/fixtures/static/` or `test/fixtures/dynamic/` files
5. **Update Exports**: Add new mock data to `test/fixtures/index.ts`

## Common Patterns

### Testing API Endpoints
```typescript
describe('CallLog API', () => {
  it('should create call log', async () => {
    const response = await request(app.getHttpServer())
      .post('/calllog')
      .send(testData)
      .expect(201);
    
    expect(response.body).toMatchObject(testData);
  });
});
```

### Testing Services
```typescript
describe('CallLogService', () => {
  it('should create call log', async () => {
    const result = await service.create(testData);
    expect(result).toBeDefined();
    expect(result.callSid).toBe(testData.callSid);
  });
});
```
