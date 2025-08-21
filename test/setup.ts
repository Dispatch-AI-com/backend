import mongoose from 'mongoose';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';

  // Connect to test database
  try {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoUri);
    console.log('Connected to test database');
  } catch (error) {
    console.error(
      'Failed to connect to test database:',
      (error as Error).message,
    );
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
