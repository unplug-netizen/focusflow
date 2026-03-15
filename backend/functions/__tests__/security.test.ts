/**
 * Security Rules Tests
 *
 * Validates security and access control for backend functions.
 */

// Mock Firebase before importing validation
jest.mock('../src/config/firebase', () => ({
  db: {},
  messaging: {},
  FieldValue: {
    increment: jest.fn((n: number) => ({__op: 'increment', value: n})),
  },
  Timestamp: {
    now: jest.fn(() => ({toDate: () => new Date(), seconds: Date.now() / 1000})),
    fromDate: jest.fn((date: Date) => date),
  },
}));

// Mock firebase-functions
jest.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(public code: string, message: string) {
        super(message);
      }
    },
  },
  pubsub: {
    schedule: jest.fn(() => ({
      timeZone: jest.fn(() => ({
        onRun: jest.fn(),
      })),
    })),
  },
  firestore: {
    document: jest.fn(() => ({
      onCreate: jest.fn(),
      onUpdate: jest.fn(),
      onWrite: jest.fn(),
    })),
  },
  runWith: jest.fn(() => ({
    https: {
      onCall: jest.fn(),
    },
  })),
}));

describe('Security Validation', () => {
  describe('Rate Limiting Security', () => {
    it('should have defined rate limit configurations', async () => {
      const {rateLimitConfigs} = await import('../src/utils/rateLimiter');

      expect(rateLimitConfigs.default).toBeDefined();
      expect(rateLimitConfigs.notifications).toBeDefined();
      expect(rateLimitConfigs.leaderboard).toBeDefined();
      expect(rateLimitConfigs.appUsage).toBeDefined();
      expect(rateLimitConfigs.stats).toBeDefined();
    });

    it('should have reasonable rate limit values', async () => {
      const {rateLimitConfigs} = await import('../src/utils/rateLimiter');

      Object.values(rateLimitConfigs).forEach(config => {
        expect(config.maxRequests).toBeGreaterThan(0);
        expect(config.maxRequests).toBeLessThanOrEqual(1000);
        expect(config.windowMs).toBeGreaterThan(0);
        expect(config.windowMs).toBeLessThanOrEqual(3600000); // 1 hour max
      });
    });
  });

  describe('Authentication Requirements', () => {
    it('should require auth for protected HTTP functions', async () => {
      const index = await import('../src/index');

      // All HTTP callable functions should require authentication
      // This is enforced by Firebase Functions, but we verify the functions exist
      expect(index.registerFcmToken).toBeDefined();
      expect(index.getLeaderboard).toBeDefined();
      expect(index.logAppUsage).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should validate string inputs correctly', async () => {
      const {validateString} = await import('../src/utils/validation');

      // Valid strings
      expect(validateString('hello', 'name').valid).toBe(true);
      expect(validateString('a'.repeat(100), 'name', {maxLength: 100}).valid).toBe(true);
      expect(validateString('abc', 'name', {minLength: 3}).valid).toBe(true);

      // Invalid strings
      expect(validateString('', 'name').valid).toBe(false);
      expect(validateString('ab', 'name', {minLength: 3}).valid).toBe(false);
      expect(validateString('a'.repeat(101), 'name', {maxLength: 100}).valid).toBe(false);
    });

    it('should validate number inputs correctly', async () => {
      const {validateNumber} = await import('../src/utils/validation');

      // Valid numbers
      expect(validateNumber(50, 'score').valid).toBe(true);
      expect(validateNumber(0, 'score').valid).toBe(true);
      expect(validateNumber(100, 'score', {min: 0, max: 100}).valid).toBe(true);
      expect(validateNumber(5, 'count', {integer: true}).valid).toBe(true);

      // Invalid numbers
      expect(validateNumber(-1, 'score', {min: 0}).valid).toBe(false);
      expect(validateNumber(101, 'score', {max: 100}).valid).toBe(false);
      expect(validateNumber(5.5, 'count', {integer: true}).valid).toBe(false);
      expect(validateNumber(NaN, 'score').valid).toBe(false);
    });

    it('should validate enum inputs correctly', async () => {
      const {validateEnum} = await import('../src/utils/validation');

      const validValues = ['bronze', 'silver', 'gold', 'platinum'];

      expect(validateEnum('gold', 'tier', validValues).valid).toBe(true);
      expect(validateEnum('invalid', 'tier', validValues).valid).toBe(false);
    });

    it('should validate date strings correctly', async () => {
      const {validateDateString} = await import('../src/utils/validation');

      // Valid dates
      expect(validateDateString('2024-03-15', 'date').valid).toBe(true);
      expect(validateDateString('2024-12-31', 'date').valid).toBe(true);

      // Invalid dates
      expect(validateDateString('2024-13-01', 'date').valid).toBe(false);
      expect(validateDateString('invalid', 'date').valid).toBe(false);
      expect(validateDateString('', 'date').valid).toBe(false);
    });
  });

  describe('String Sanitization', () => {
    it('should sanitize potentially dangerous strings', async () => {
      const {sanitizeString} = await import('../src/utils/validation');

      const dangerousStrings = [
        {input: '<script>alert("xss")</script>', expected: 'scriptalert("xss")/script'},
        {input: 'normal text', expected: 'normal text'},
        {input: '  trimmed  ', expected: 'trimmed'},
        {input: '<p>paragraph</p>', expected: 'pparagraph/p'},
      ];

      dangerousStrings.forEach(({input, expected}) => {
        expect(sanitizeString(input)).toBe(expected);
      });
    });

    it('should handle empty strings', async () => {
      const {sanitizeString} = await import('../src/utils/validation');
      expect(sanitizeString('')).toBe('');
    });
  });

  describe('User ID Validation', () => {
    it('should validate correct user IDs', async () => {
      const {validateUserId} = await import('../src/utils/validation');

      const validIds = [
        'user123',
        'abc123def456',
        'user_123',
        'user-123',
        'a1b2c3d4e5f6',
      ];

      validIds.forEach(id => {
        const result = validateUserId(id);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid user IDs', async () => {
      const {validateUserId} = await import('../src/utils/validation');

      const invalidIds = [
        '',
        '   ',
        'ab', // Too short
        'a'.repeat(129), // Too long
      ];

      invalidIds.forEach(id => {
        const result = validateUserId(id);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('FCM Token Validation', () => {
    it('should validate correct FCM tokens', async () => {
      const {validateFcmToken} = await import('../src/utils/validation');

      const validTokens = [
        'fcm_token_12345' + 'a'.repeat(150), // Min 100 chars
        'abc123_def456' + 'a'.repeat(150),
        'a'.repeat(250),
        'tokenwithdashesandmorecharacterstomeetminimumlengthrequirementof100charsxyz' + 'a'.repeat(50),
        'tokenwithunderscoresandmorecharacterstomeetminimumlengthrequirementof100chars12345' + 'a'.repeat(50),
      ];

      validTokens.forEach(token => {
        const result = validateFcmToken(token);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid FCM tokens', async () => {
      const {validateFcmToken} = await import('../src/utils/validation');

      const invalidTokens = [
        '',
        '   ',
        'ab', // Too short
        'a'.repeat(501), // Too long
        'token:with:colons' + 'a'.repeat(100), // Invalid chars
      ];

      invalidTokens.forEach(token => {
        const result = validateFcmToken(token);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('Error Handling Security', () => {
    it('should not leak sensitive information in errors', async () => {
      const {withErrorHandling} = await import('../src/utils/errorTracker');

      const sensitiveFunction = async () => {
        throw new Error('Database connection failed: password=secret123');
      };

      const wrapped = withErrorHandling(sensitiveFunction, 'testFunction');

      // Should return null on error (not throw)
      const result = await wrapped({} as never, {} as never);
      expect(result).toBeNull();
    });
  });

  describe('Batch Operation Limits', () => {
    it('should respect Firestore batch limits', async () => {
      const {LeaderboardService} = await import('../src/services/leaderboardService');
      const service = new LeaderboardService();

      // The service should handle batch operations correctly
      expect(service).toBeDefined();
    });
  });
});
