/**
 * Error Tracking and Logging Utilities
 * 
 * Provides centralized error handling, logging, and tracking for Firebase Cloud Functions.
 * Includes retry logic for transient failures and structured logging.
 */

import * as functions from 'firebase-functions';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Structured error context
 */
export interface ErrorContext {
  userId?: string;
  functionName: string;
  operation: string;
  metadata?: Record<string, unknown>;
}

/**
 * Error log entry
 */
interface ErrorLogEntry {
  timestamp: Date;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: ErrorContext;
  retryCount?: number;
}

// In-memory error log (in production, use a proper error tracking service like Sentry)
const errorLog: ErrorLogEntry[] = [];
const MAX_ERROR_LOG_SIZE = 1000;

/**
 * Log an error with structured context
 */
export function logError(
  error: Error,
  context: ErrorContext,
  severity: ErrorSeverity = 'medium'
): void {
  const entry: ErrorLogEntry = {
    timestamp: new Date(),
    severity,
    message: error.message,
    stack: error.stack,
    context,
  };

  // Add to in-memory log with size limit
  errorLog.unshift(entry);
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.pop();
  }

  // Also log to console with structured format
  console.error(JSON.stringify({
    type: 'ERROR',
    severity,
    message: error.message,
    function: context.functionName,
    operation: context.operation,
    userId: context.userId,
    metadata: context.metadata,
    stack: error.stack,
  }));
}

/**
 * Execute a function with retry logic for transient failures
 * @param operation - The async operation to execute
 * @param context - Error context for logging
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds (exponential backoff)
 * @returns Result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain errors
      if (error instanceof functions.https.HttpsError) {
        const nonRetryableCodes = [
          'invalid-argument',
          'unauthenticated',
          'permission-denied',
          'not-found',
        ];
        if (nonRetryableCodes.includes(error.code)) {
          throw error;
        }
      }

      // Log the error
      logError(lastError, {
        ...context,
        metadata: {
          ...context.metadata,
          attempt,
          maxRetries,
        },
      }, attempt === maxRetries ? 'high' : 'medium');

      // Don't delay on last attempt
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wrap a Firestore trigger with error handling and retry logic
 * @param handler - The trigger handler function
 * @param functionName - Name of the function for logging
 * @returns Wrapped handler
 */
export function withErrorHandling<T, R>(
  handler: (data: T, context: functions.EventContext) => Promise<R>,
  functionName: string
): (data: T, context: functions.EventContext) => Promise<R | null> {
  return async (data: T, context: functions.EventContext): Promise<R | null> => {
    try {
      return await withRetry(
        () => handler(data, context),
        {
          functionName,
          operation: 'trigger',
          userId: context.params?.userId,
          metadata: {
            eventId: context.eventId,
            timestamp: context.timestamp,
          },
        },
        3,
        1000
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, {
        functionName,
        operation: 'trigger',
        userId: context.params?.userId,
        metadata: {
          eventId: context.eventId,
        },
      }, 'high');
      
      // Return null to indicate failure without crashing the function
      return null;
    }
  };
}

/**
 * Get recent errors from the error log
 * @param count - Number of errors to retrieve
 * @param severity - Filter by severity (optional)
 * @returns Array of error log entries
 */
export function getRecentErrors(
  count: number = 50,
  severity?: ErrorSeverity
): ErrorLogEntry[] {
  let filtered = errorLog;
  if (severity) {
    filtered = errorLog.filter(e => e.severity === severity);
  }
  return filtered.slice(0, count);
}

/**
 * Get error statistics
 * @returns Error statistics by severity
 */
export function getErrorStats(): Record<ErrorSeverity, number> {
  const stats: Record<ErrorSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  errorLog.forEach(entry => {
    stats[entry.severity]++;
  });

  return stats;
}

/**
 * Clear the error log (useful for testing)
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}

/**
 * Create a structured logger for a specific function
 * @param functionName - Name of the function
 * @returns Logger instance
 */
export function createLogger(functionName: string) {
  return {
    info: (message: string, metadata?: Record<string, unknown>) => {
      console.log(JSON.stringify({
        type: 'INFO',
        function: functionName,
        message,
        metadata,
        timestamp: new Date().toISOString(),
      }));
    },
    warn: (message: string, metadata?: Record<string, unknown>) => {
      console.warn(JSON.stringify({
        type: 'WARN',
        function: functionName,
        message,
        metadata,
        timestamp: new Date().toISOString(),
      }));
    },
    error: (error: Error, operation: string, metadata?: Record<string, unknown>) => {
      logError(error, {
        functionName,
        operation,
        metadata,
      });
    },
  };
}
