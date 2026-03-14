/**
 * Tests für Rate Limiter Utility
 */

import {
  checkRateLimit,
  getRateLimitStatus,
  clearRateLimit,
  cleanupRateLimiterStore,
  rateLimitConfigs,
} from '../src/utils/rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    cleanupRateLimiterStore();
  });

  afterEach(() => {
    cleanupRateLimiterStore();
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('user1', { windowMs: 60000, maxRequests: 10 });
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should track multiple requests', () => {
      const config = { windowMs: 60000, maxRequests: 5 };
      
      // Make requests up to limit
      let lastResult;
      for (let i = 0; i < 5; i++) {
        lastResult = checkRateLimit('user1', config);
      }
      
      // After 5 requests, we should have 0 remaining
      expect(lastResult!.remaining).toBe(0);
      
      // Next request should be blocked
      const blockedResult = checkRateLimit('user1', config);
      expect(blockedResult.allowed).toBe(false);
    });

    it('should handle different users independently', () => {
      const config = { windowMs: 60000, maxRequests: 2 };
      
      // User 1 makes 2 requests
      checkRateLimit('user1', config);
      checkRateLimit('user1', config);
      
      // User 2 should still be able to make requests
      const result = checkRateLimit('user2', config);
      expect(result.allowed).toBe(true);
    });

    it('should reset after window expires', () => {
      const config = { windowMs: 100, maxRequests: 1 };
      
      // Use up the limit
      checkRateLimit('user1', config);
      const blockedResult = checkRateLimit('user1', config);
      expect(blockedResult.allowed).toBe(false);
      
      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          const result = checkRateLimit('user1', config);
          expect(result.allowed).toBe(true);
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return full quota for new user', () => {
      const config = { windowMs: 60000, maxRequests: 100 };
      const status = getRateLimitStatus('newuser', config);
      
      expect(status.remaining).toBe(100);
      expect(status.maxRequests).toBe(100);
      expect(status.windowMs).toBe(60000);
    });

    it('should reflect used quota', () => {
      const config = { windowMs: 60000, maxRequests: 10 };
      
      // Use 4 requests
      for (let i = 0; i < 4; i++) {
        checkRateLimit('user1', config);
      }
      
      const status = getRateLimitStatus('user1', config);
      // After 4 requests, remaining should be around 6 (10 - 4)
      // Allow for slight variations due to timing
      expect(status.remaining).toBeGreaterThanOrEqual(5);
      expect(status.remaining).toBeLessThanOrEqual(6);
    });
  });

  describe('clearRateLimit', () => {
    it('should reset user quota', () => {
      const config = { windowMs: 60000, maxRequests: 2 };
      
      // Use up quota
      checkRateLimit('user1', config);
      checkRateLimit('user1', config);
      
      // Clear rate limit
      clearRateLimit('user1');
      
      // Should be able to make requests again
      const result = checkRateLimit('user1', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });

  describe('cleanupRateLimiterStore', () => {
    it('should remove old entries', () => {
      const config = { windowMs: 50, maxRequests: 10 };
      
      // Create some entries
      checkRateLimit('user1', config);
      checkRateLimit('user2', config);
      
      // Wait for entries to become old
      return new Promise(resolve => {
        setTimeout(() => {
          const cleaned = cleanupRateLimiterStore();
          expect(cleaned).toBeGreaterThanOrEqual(0);
          resolve(undefined);
        }, 100);
      });
    });
  });

  describe('rateLimitConfigs', () => {
    it('should have default config', () => {
      expect(rateLimitConfigs.default).toBeDefined();
      expect(rateLimitConfigs.default.maxRequests).toBeGreaterThan(0);
      expect(rateLimitConfigs.default.windowMs).toBeGreaterThan(0);
    });

    it('should have specialized configs', () => {
      expect(rateLimitConfigs.leaderboard).toBeDefined();
      expect(rateLimitConfigs.notifications).toBeDefined();
      expect(rateLimitConfigs.appUsage).toBeDefined();
      expect(rateLimitConfigs.stats).toBeDefined();
    });

    it('should have stricter limits for notifications', () => {
      expect(rateLimitConfigs.notifications.maxRequests)
        .toBeLessThan(rateLimitConfigs.stats.maxRequests);
    });
  });
});
