// Test setup file
// This file runs before each test file

// Set environment variables for tests
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Dummy test to prevent "empty test suite" error
describe('Test Setup', () => {
  it('should have environment configured', () => {
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBe('localhost:8080');
  });
});
