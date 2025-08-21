import mongoose from 'mongoose';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  // Set mock Twilio credentials for testing
  process.env.TWILIO_ACCOUNT_SID = 'AC_test_account_sid';
  process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';

  // Connect to test database
  try {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
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
    await mongoose.connection.close();
    console.log('Disconnected from test database');
  } catch (error) {
    console.error(
      'Error closing test database connection:',
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
