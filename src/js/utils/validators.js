/**
 * Form Validation Functions
 */

import { isValidEmail } from './helpers.js';
import { USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_PATTERN } from '../config/constants.js';

/**
 * Validation result
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Is valid
 * @property {string} [error] - Error message if invalid
 */

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateRequired(value, fieldName = 'Field') {
  if (value === null || value === undefined || value === '') {
    return {
      valid: false,
      error: `${fieldName} is required`
    };
  }

  return { valid: true };
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {ValidationResult}
 */
export function validateEmail(email) {
  const requiredCheck = validateRequired(email, 'Email');
  if (!requiredCheck.valid) return requiredCheck;

  if (!isValidEmail(email)) {
    return {
      valid: false,
      error: 'Please enter a valid email address'
    };
  }

  return { valid: true };
}

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult}
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false
  } = options;

  const requiredCheck = validateRequired(password, 'Password');
  if (!requiredCheck.valid) return requiredCheck;

  if (password.length < minLength) {
    return {
      valid: false,
      error: `Password must be at least ${minLength} characters`
    };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter'
    };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter'
    };
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one number'
    };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one special character'
    };
  }

  return { valid: true };
}

/**
 * Validate password confirmation
 * @param {string} password - Password
 * @param {string} confirmPassword - Password confirmation
 * @returns {ValidationResult}
 */
export function validatePasswordConfirmation(password, confirmPassword) {
  const requiredCheck = validateRequired(confirmPassword, 'Password confirmation');
  if (!requiredCheck.valid) return requiredCheck;

  if (password !== confirmPassword) {
    return {
      valid: false,
      error: 'Passwords do not match'
    };
  }

  return { valid: true };
}

/**
 * Validate string length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateLength(value, minLength, maxLength, fieldName = 'Field') {
  const requiredCheck = validateRequired(value, fieldName);
  if (!requiredCheck.valid) return requiredCheck;

  if (value.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be no more than ${maxLength} characters`
    };
  }

  return { valid: true };
}

/**
 * Validate slug (URL-friendly string)
 * @param {string} slug - Slug to validate
 * @returns {ValidationResult}
 */
export function validateSlug(slug) {
  const requiredCheck = validateRequired(slug, 'Slug');
  if (!requiredCheck.valid) return requiredCheck;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      valid: false,
      error: 'Slug must contain only lowercase letters, numbers, and hyphens'
    };
  }

  return { valid: true };
}

/**
 * Validate organization name
 * @param {string} name - Organization name
 * @returns {ValidationResult}
 */
export function validateOrganizationName(name) {
  return validateLength(name, 2, 100, 'Organization name');
}

/**
 * Validate form data
 * @param {Object} data - Form data
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation errors (empty if valid)
 */
export function validateForm(data, rules) {
  const errors = {};

  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field];

    for (const validator of validators) {
      const result = validator(value);

      if (!result.valid) {
        errors[field] = result.error;
        break; // Stop at first error for this field
      }
    }
  }

  return errors;
}

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {ValidationResult}
 */
export function validateUsername(username) {
  const requiredCheck = validateRequired(username, 'Username');
  if (!requiredCheck.valid) return requiredCheck;

  if (username.length < USERNAME_MIN_LENGTH) {
    return {
      valid: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters`
    };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Username must be no more than ${USERNAME_MAX_LENGTH} characters`
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain lowercase letters, numbers, and underscores'
    };
  }

  return { valid: true };
}

/**
 * Validate optional email (can be empty)
 * @param {string} email - Email to validate
 * @returns {ValidationResult}
 */
export function validateOptionalEmail(email) {
  // Empty is valid
  if (!email || email.trim() === '') {
    return { valid: true };
  }

  // If provided, must be valid
  if (!isValidEmail(email)) {
    return {
      valid: false,
      error: 'Please enter a valid email address'
    };
  }

  return { valid: true };
}

/**
 * Validate security question answer
 * @param {string} answer - Answer to validate
 * @returns {ValidationResult}
 */
export function validateSecurityAnswer(answer) {
  const requiredCheck = validateRequired(answer, 'Answer');
  if (!requiredCheck.valid) return requiredCheck;

  if (answer.trim().length < 2) {
    return {
      valid: false,
      error: 'Answer must be at least 2 characters'
    };
  }

  return { valid: true };
}
