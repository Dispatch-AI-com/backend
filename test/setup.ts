import mongoose from 'mongoose';

// Mock Twilio module globally to bypass Twilio initialization in tests
jest.mock('../src/lib/twilio/twilio.module', () => ({
  TwilioModule: jest.fn(),
  TWILIO_CLIENT: 'MOCK_TWILIO_CLIENT',
}));

// Mock Twilio client
jest.mock('twilio', () => {
  return jest.fn().mockReturnValue({
    // Add any Twilio methods that might be used in tests
    calls: {
      create: jest.fn(),
      list: jest.fn(),
    },
    messages: {
      create: jest.fn(),
      list: jest.fn(),
    },
  });
});

// Mock AuthGuard globally to bypass authentication in tests
jest.mock('@nestjs/passport', () => {
  const originalModule = jest.requireActual('@nestjs/passport');
  return {
    ...originalModule,
    AuthGuard: (_strategy?: string) => {
      return class MockAuthGuard {
        canActivate(): boolean {
          return true; // Always allow access in tests
        }
      };
    },
  };
});

// Mock JWT strategy to provide a default user for tests
jest.mock('../src/modules/auth/strategies/jwt.strategy', () => {
  return {
    JwtStrategy: class MockJwtStrategy {
      validate() {
        // Return a default test user
        return {
          _id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          role: 'user',
          status: 'active',
        };
      }
    },
  };
});

// Export test user data for use in tests
export const TEST_USER = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  role: 'user',
  status: 'active',
};

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DISABLE_AUTH = 'true'; // Flag for any additional auth checks

  // Database configuration
  process.env.MONGODB_URI = process.env.CI
    ? 'mongodb://localhost:27017/test-ci'
    : 'mongodb://localhost:27017/test';

  // Security secrets
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.CSRF_SECRET = 'test-csrf-secret';

  // Service URLs
  process.env.APP_URL = 'http://localhost:3000';
  process.env.AI_URL = 'http://localhost:8000/api';

  // Redis configuration
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';

  // Twilio configuration (mocked, but set to avoid errors)
  process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
  process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';

  // Connect to test database
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {
      // Add connection options for better reliability in CI
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // In CI, we want to ensure we get a fresh database
      dbName: process.env.CI ? 'test-ci' : 'test',
    });
    console.log('Connected to test database');
  } catch (error) {
    console.error(
      'Failed to connect to test database:',
      (error as Error).message,
    );
    // In CI environment, we want to fail fast
    if (process.env.CI) {
      throw error;
    }
    // Don't throw error here, let individual tests handle it
  }
}, 30000);

// Global test teardown
afterAll(async () => {
  try {
    // Clean up all collections before closing
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    await mongoose.connection.close();
    console.log('Disconnected from test database');
  } catch (error) {
    console.error(
      'Error closing test database connection:',
      (error as Error).message,
    );
  }
});

// Global beforeEach to clean database before each test
beforeEach(async () => {
  try {
    // Clean up all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error(
      'Error cleaning database before test:',
      (error as Error).message,
    );
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});
