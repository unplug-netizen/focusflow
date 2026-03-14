/**
 * Validation Utilities
 * 
 * Input validation helpers for Firebase Cloud Functions
 */

import * as functions from 'firebase-functions';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a string field
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options: { minLength?: number; maxLength?: number; required?: boolean } = {}
): ValidationResult {
  const errors: string[] = [];
  const { minLength = 1, maxLength = 1000, required = true } = options;

  if (required && (value === undefined || value === null)) {
    errors.push(`${fieldName} is required`);
    return { valid: false, errors };
  }

  if (!required && (value === undefined || value === null)) {
    return { valid: true, errors };
  }

  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { valid: false, errors };
  }

  if (value.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`);
  }

  if (value.length > maxLength) {
    errors.push(`${fieldName} must be at most ${maxLength} characters`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a number field
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number; required?: boolean; integer?: boolean } = {}
): ValidationResult {
  const errors: string[] = [];
  const { min, max, required = true, integer = false } = options;

  if (required && (value === undefined || value === null)) {
    errors.push(`${fieldName} is required`);
    return { valid: false, errors };
  }

  if (!required && (value === undefined || value === null)) {
    return { valid: true, errors };
  }

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${fieldName} must be a valid number`);
    return { valid: false, errors };
  }

  if (integer && !Number.isInteger(value)) {
    errors.push(`${fieldName} must be an integer`);
  }

  if (min !== undefined && value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && value > max) {
    errors.push(`${fieldName} must be at most ${max}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an array field
 */
export function validateArray<T>(
  value: unknown,
  fieldName: string,
  options: { minLength?: number; maxLength?: number; required?: boolean; itemValidator?: (item: T) => boolean } = {}
): ValidationResult {
  const errors: string[] = [];
  const { minLength = 0, maxLength = 1000, required = true, itemValidator } = options;

  if (required && (value === undefined || value === null)) {
    errors.push(`${fieldName} is required`);
    return { valid: false, errors };
  }

  if (!required && (value === undefined || value === null)) {
    return { valid: true, errors };
  }

  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array`);
    return { valid: false, errors };
  }

  if (value.length < minLength) {
    errors.push(`${fieldName} must have at least ${minLength} items`);
  }

  if (value.length > maxLength) {
    errors.push(`${fieldName} must have at most ${maxLength} items`);
  }

  if (itemValidator) {
    const invalidItems = value.filter((item, index) => {
      try {
        return !itemValidator(item);
      } catch {
        errors.push(`${fieldName}[${index}] is invalid`);
        return true;
      }
    });
    
    if (invalidItems.length > 0 && errors.length === 0) {
      errors.push(`${fieldName} contains ${invalidItems.length} invalid items`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an enum value
 */
export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: T[],
  options: { required?: boolean } = {}
): ValidationResult {
  const errors: string[] = [];
  const { required = true } = options;

  if (required && (value === undefined || value === null)) {
    errors.push(`${fieldName} is required`);
    return { valid: false, errors };
  }

  if (!required && (value === undefined || value === null)) {
    return { valid: true, errors };
  }

  if (!allowedValues.includes(value as T)) {
    errors.push(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a date string
 */
export function validateDateString(
  value: unknown,
  fieldName: string,
  options: { required?: boolean; allowFuture?: boolean } = {}
): ValidationResult {
  const errors: string[] = [];
  const { required = true, allowFuture = true } = options;

  if (required && (value === undefined || value === null)) {
    errors.push(`${fieldName} is required`);
    return { valid: false, errors };
  }

  if (!required && (value === undefined || value === null)) {
    return { valid: true, errors };
  }

  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { valid: false, errors };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push(`${fieldName} must be a valid date string`);
    return { valid: false, errors };
  }

  if (!allowFuture && date > new Date()) {
    errors.push(`${fieldName} cannot be in the future`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(r => r.errors);
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Throw HttpsError if validation fails
 */
export function assertValid(validation: ValidationResult): void {
  if (!validation.valid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      validation.errors.join('; ')
    );
  }
}

/**
 * Sanitize a string to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate FCM token format
 */
export function validateFcmToken(token: unknown): ValidationResult {
  const stringValidation = validateString(token, 'token', { minLength: 100, maxLength: 500 });
  if (!stringValidation.valid) {
    return stringValidation;
  }

  // FCM tokens typically start with specific prefixes
  const tokenStr = token as string;
  
  // Basic format check - FCM tokens are usually base64-like strings
  const fcmTokenPattern = /^[A-Za-z0-9_-]+$/;
  if (!fcmTokenPattern.test(tokenStr)) {
    return {
      valid: false,
      errors: ['token contains invalid characters'],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate user ID format
 */
export function validateUserId(userId: unknown): ValidationResult {
  return validateString(userId, 'userId', { minLength: 5, maxLength: 128 });
}
