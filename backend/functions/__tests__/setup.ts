// Test setup file
// This file runs before each test file

// Set environment variables for tests
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Global test setup
beforeAll(() => {
  // Setup code that runs before all tests
});

afterAll(() => {
  // Cleanup code that runs after all tests
});
