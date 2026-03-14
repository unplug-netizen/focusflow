/**
 * Tests für Validation Utilities
 */

import {
  validateString,
  validateNumber,
  validateArray,
  validateEnum,
  validateDateString,
  combineValidations,
  assertValid,
  sanitizeString,
  validateFcmToken,
  validateUserId,
} from '../src/utils/validation';

import * as functions from 'firebase-functions';

// Mock firebase-functions
jest.mock('firebase-functions', () => ({
  https: {
    HttpsError: class extends Error {
      code: string;
      constructor(code: string, message: string) {
        super(message);
        this.code = code;
      }
    },
  },
}));

describe('Validation Utilities', () => {
  describe('validateString', () => {
    it('should validate required string', () => {
      const result = validateString('test', 'field');
      expect(result.valid).toBe(true);
    });

    it('should reject undefined when required', () => {
      const result = validateString(undefined, 'field');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field is required');
    });

    it('should allow undefined when not required', () => {
      const result = validateString(undefined, 'field', { required: false });
      expect(result.valid).toBe(true);
    });

    it('should reject non-string values', () => {
      const result = validateString(123, 'field');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field must be a string');
    });

    it('should enforce min length', () => {
      const result = validateString('ab', 'field', { minLength: 3 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field must be at least 3 characters');
    });

    it('should enforce max length', () => {
      const result = validateString('a'.repeat(1001), 'field', { maxLength: 1000 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field must be at most 1000 characters');
    });
  });

  describe('validateNumber', () => {
    it('should validate required number', () => {
      const result = validateNumber(42, 'field');
      expect(result.valid).toBe(true);
    });

    it('should reject undefined when required', () => {
      const result = validateNumber(undefined, 'field');
      expect(result.valid).toBe(false);
    });

    it('should reject non-number values', () => {
      const result = validateNumber('42', 'field');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field must be a valid number');
    });

    it('should reject NaN', () => {
      const result = validateNumber(NaN, 'field');
      expect(result.valid).toBe(false);
    });

    it('should enforce minimum value', () => {
      const result = validateNumber(5, 'field', { min: 10 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field must be at least 10');
    });

    it('should enforce maximum value', () => {
      const result = validateNumber(100, 'field', { max: 50 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field must be at most 50');
    });

    it('should enforce integer constraint', () => {
      const result = validateNumber(3.14, 'field', { integer: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field must be an integer');
    });
  });

  describe('validateArray', () => {
    it('should validate required array', () => {
      const result = validateArray([1, 2, 3], 'field');
      expect(result.valid).toBe(true);
    });

    it('should reject undefined when required', () => {
      const result = validateArray(undefined, 'field');
      expect(result.valid).toBe(false);
    });

    it('should reject non-array values', () => {
      const result = validateArray('not an array', 'field');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field must be an array');
    });

    it('should enforce min length', () => {
      const result = validateArray([1], 'field', { minLength: 2 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field must have at least 2 items');
    });

    it('should enforce max length', () => {
      const result = validateArray([1, 2, 3], 'field', { maxLength: 2 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('field must have at most 2 items');
    });

    it('should validate array items', () => {
      const result = validateArray<number>([1, 2, 3], 'field', {
        itemValidator: (item) => typeof item === 'number' && item > 0,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateEnum', () => {
    it('should validate allowed enum value', () => {
      const result = validateEnum('active', 'status', ['active', 'inactive']);
      expect(result.valid).toBe(true);
    });

    it('should reject undefined when required', () => {
      const result = validateEnum(undefined, 'status', ['active', 'inactive']);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid enum value', () => {
      const result = validateEnum('pending', 'status', ['active', 'inactive']);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('must be one of');
    });
  });

  describe('validateDateString', () => {
    it('should validate ISO date string', () => {
      const result = validateDateString('2024-03-14', 'date');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid date string', () => {
      const result = validateDateString('not-a-date', 'date');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('date must be a valid date string');
    });

    it('should reject future dates when not allowed', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = validateDateString(
        futureDate.toISOString(),
        'date',
        { allowFuture: false }
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('date cannot be in the future');
    });
  });

  describe('combineValidations', () => {
    it('should combine multiple valid results', () => {
      const result = combineValidations(
        { valid: true, errors: [] },
        { valid: true, errors: [] }
      );
      expect(result.valid).toBe(true);
    });

    it('should combine errors from invalid results', () => {
      const result = combineValidations(
        { valid: false, errors: ['error1'] },
        { valid: false, errors: ['error2'] }
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['error1', 'error2']);
    });

    it('should handle mixed valid and invalid results', () => {
      const result = combineValidations(
        { valid: true, errors: [] },
        { valid: false, errors: ['error1'] }
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['error1']);
    });
  });

  describe('assertValid', () => {
    it('should not throw for valid result', () => {
      expect(() => {
        assertValid({ valid: true, errors: [] });
      }).not.toThrow();
    });

    it('should throw HttpsError for invalid result', () => {
      expect(() => {
        assertValid({ valid: false, errors: ['field is required'] });
      }).toThrow(functions.https.HttpsError);
    });
  });

  describe('sanitizeString', () => {
    it('should remove angle brackets', () => {
      const result = sanitizeString('<script>alert("xss")</script>');
      expect(result).toBe('scriptalert("xss")/script');
    });

    it('should trim whitespace', () => {
      const result = sanitizeString('  hello world  ');
      expect(result).toBe('hello world');
    });

    it('should limit length', () => {
      const longString = 'a'.repeat(2000);
      const result = sanitizeString(longString);
      expect(result.length).toBe(1000);
    });
  });

  describe('validateFcmToken', () => {
    it('should reject short tokens', () => {
      const result = validateFcmToken('short');
      expect(result.valid).toBe(false);
    });

    it('should reject tokens with invalid characters', () => {
      const result = validateFcmToken('a'.repeat(150) + '<script>');
      expect(result.valid).toBe(false);
    });

    it('should accept valid-looking FCM token', () => {
      const validToken = 'fcm-' + 'a'.repeat(150);
      const result = validateFcmToken(validToken);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateUserId', () => {
    it('should validate user ID', () => {
      const result = validateUserId('user123');
      expect(result.valid).toBe(true);
    });

    it('should reject short user IDs', () => {
      const result = validateUserId('usr');
      expect(result.valid).toBe(false);
    });

    it('should reject non-string user IDs', () => {
      const result = validateUserId(12345);
      expect(result.valid).toBe(false);
    });
  });
});
