/**
 * Rate Limiting Middleware for Firebase Cloud Functions
 * 
 * Provides rate limiting to prevent abuse of HTTP callable functions.
 * Tracks requests per user with configurable time windows and limits.
 */

import * as functions from 'firebase-functions';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

interface RateLimitEntry {
  timestamps: number[];
  lastReset: number;
}

// In-memory store for rate limiting (consider Redis for multi-instance deployments)
const rateLimiterStore = new Map<string, RateLimitEntry>();

// Default configuration: 100 requests per minute
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,
};

/**
 * Rate limiting configuration for different function types
 */
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  default: DEFAULT_CONFIG,
  // Stricter limits for resource-intensive operations
  leaderboard: { windowMs: 60 * 1000, maxRequests: 30 },
  notifications: { windowMs: 60 * 1000, maxRequests: 20 },
  appUsage: { windowMs: 60 * 1000, maxRequests: 60 },
  // More lenient for read operations
  stats: { windowMs: 60 * 1000, maxRequests: 120 },
};

/**
 * Check if a user has exceeded their rate limit
 * @param userId - The user's unique identifier
 * @param config - Rate limiting configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimiterStore.get(userId);

  if (!entry || now - entry.lastReset > config.windowMs) {
    // First request or window expired - create new entry
    rateLimiterStore.set(userId, {
      timestamps: [now],
      lastReset: now,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Filter timestamps within the current window
  const validTimestamps = entry.timestamps.filter(
    (timestamp) => now - timestamp < config.windowMs
  );

  if (validTimestamps.length >= config.maxRequests) {
    // Rate limit exceeded
    const oldestTimestamp = validTimestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetTime: oldestTimestamp + config.windowMs,
    };
  }

  // Request allowed - add timestamp
  validTimestamps.push(now);
  rateLimiterStore.set(userId, {
    timestamps: validTimestamps,
    lastReset: entry.lastReset,
  });

  return {
    allowed: true,
    remaining: config.maxRequests - validTimestamps.length,
    resetTime: entry.lastReset + config.windowMs,
  };
}

/**
 * Clear rate limit data for a user (useful for testing or admin operations)
 * @param userId - The user's unique identifier
 */
export function clearRateLimit(userId: string): void {
  rateLimiterStore.delete(userId);
}

/**
 * Get current rate limit status for a user
 * @param userId - The user's unique identifier
 * @param config - Rate limiting configuration
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  userId: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { remaining: number; resetTime: number; windowMs: number; maxRequests: number } {
  const now = Date.now();
  const entry = rateLimiterStore.get(userId);

  if (!entry || now - entry.lastReset > config.windowMs) {
    return {
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
    };
  }

  const validTimestamps = entry.timestamps.filter(
    (timestamp) => now - timestamp < config.windowMs
  );

  return {
    remaining: Math.max(0, config.maxRequests - validTimestamps.length),
    resetTime: entry.lastReset + config.windowMs,
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
  };
}

/**
 * Middleware wrapper for HTTP callable functions with rate limiting
 * @param handler - The function handler
 * @param configName - Name of the rate limit configuration to use
 * @returns Wrapped function with rate limiting
 */
export function withRateLimit<T = unknown>(
  handler: (data: T, context: functions.https.CallableContext) => Promise<unknown>,
  configName: keyof typeof rateLimitConfigs = 'default'
): functions.HttpsFunction {
  const config = rateLimitConfigs[configName] || DEFAULT_CONFIG;

  return functions.https.onCall(async (data: T, context: functions.https.CallableContext) => {
    // Check authentication first
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const rateLimitResult = checkRateLimit(userId, config);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        {
          retryAfter,
          remaining: 0,
          resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        }
      );
    }

    try {
      const result = await handler(data, context);
      return {
        ...((result as Record<string, unknown>) || {}),
        _rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        },
      };
    } catch (error) {
      // Re-throw HttpsError as-is (check by code property for compatibility)
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      // Wrap other errors
      console.error('Function error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new functions.https.HttpsError('internal', message);
    }
  });
}

/**
 * Cleanup old rate limit entries (should be called periodically)
 * Removes entries that haven't been used in the last hour
 */
export function cleanupRateLimiterStore(): number {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  let cleanedCount = 0;

  for (const [userId, entry] of rateLimiterStore.entries()) {
    if (now - entry.lastReset > maxAge) {
      rateLimiterStore.delete(userId);
      cleanedCount++;
    }
  }

  return cleanedCount;
}
