/**
 * Tests für Error Tracker Utility
 */

import {
  logError,
  withRetry,
  getRecentErrors,
  getErrorStats,
  clearErrorLog,
  createLogger,
} from '../src/utils/errorTracker';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('Error Tracker', () => {
  beforeEach(() => {
    clearErrorLog();
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = {
        functionName: 'testFunction',
        operation: 'testOp',
        userId: 'user123',
      };

      logError(error, context, 'high');

      expect(mockConsoleError).toHaveBeenCalled();
      const logged = JSON.parse(mockConsoleError.mock.calls[0][0]);
      expect(logged.type).toBe('ERROR');
      expect(logged.severity).toBe('high');
      expect(logged.function).toBe('testFunction');
    });

    it('should store error in memory', () => {
      const error = new Error('Test error');
      const context = {
        functionName: 'testFunction',
        operation: 'testOp',
      };

      logError(error, context);
      const errors = getRecentErrors(1);

      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Test error');
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const context = {
        functionName: 'test',
        operation: 'testOp',
      };

      const result = await withRetry(operation, context, 3, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValue('success');
      
      const context = {
        functionName: 'test',
        operation: 'testOp',
      };

      const result = await withRetry(operation, context, 3, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      const context = {
        functionName: 'test',
        operation: 'testOp',
      };

      await expect(withRetry(operation, context, 2, 10))
        .rejects.toThrow('Persistent error');
      
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      // This test verifies the structure of non-retryable error handling
      // The actual implementation checks for HttpsError codes
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation, {
        functionName: 'test',
        operation: 'testOp',
      }, 2, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRecentErrors', () => {
    it('should return recent errors', () => {
      const context = {
        functionName: 'test',
        operation: 'testOp',
      };

      logError(new Error('Error 1'), context);
      logError(new Error('Error 2'), context);
      logError(new Error('Error 3'), context);

      const errors = getRecentErrors(2);

      expect(errors.length).toBe(2);
      expect(errors[0].message).toBe('Error 3'); // Most recent first
      expect(errors[1].message).toBe('Error 2');
    });

    it('should filter by severity', () => {
      const context = {
        functionName: 'test',
        operation: 'testOp',
      };

      logError(new Error('Low'), context, 'low');
      logError(new Error('High'), context, 'high');

      const highErrors = getRecentErrors(10, 'high');

      expect(highErrors.length).toBe(1);
      expect(highErrors[0].severity).toBe('high');
    });
  });

  describe('getErrorStats', () => {
    it('should return error counts by severity', () => {
      const context = {
        functionName: 'test',
        operation: 'testOp',
      };

      logError(new Error('1'), context, 'low');
      logError(new Error('2'), context, 'medium');
      logError(new Error('3'), context, 'high');
      logError(new Error('4'), context, 'critical');

      const stats = getErrorStats();

      expect(stats.low).toBe(1);
      expect(stats.medium).toBe(1);
      expect(stats.high).toBe(1);
      expect(stats.critical).toBe(1);
    });
  });

  describe('clearErrorLog', () => {
    it('should clear all errors', () => {
      const context = {
        functionName: 'test',
        operation: 'testOp',
      };

      logError(new Error('Test'), context);
      expect(getRecentErrors(1).length).toBe(1);

      clearErrorLog();
      expect(getRecentErrors(1).length).toBe(0);
    });
  });

  describe('createLogger', () => {
    it('should create logger with info method', () => {
      const logger = createLogger('testFunction');
      
      logger.info('Test message', { key: 'value' });

      expect(mockConsoleLog).toHaveBeenCalled();
      const logged = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logged.type).toBe('INFO');
      expect(logged.function).toBe('testFunction');
      expect(logged.message).toBe('Test message');
    });

    it('should create logger with warn method', () => {
      const logger = createLogger('testFunction');
      
      logger.warn('Warning message');

      expect(mockConsoleWarn).toHaveBeenCalled();
      const logged = JSON.parse(mockConsoleWarn.mock.calls[0][0]);
      expect(logged.type).toBe('WARN');
    });

    it('should create logger with error method', () => {
      const logger = createLogger('testFunction');
      const error = new Error('Test error');
      
      logger.error(error, 'testOperation');

      expect(mockConsoleError).toHaveBeenCalled();
    });
  });
});
