import type { ValidationRule } from "./types";

/**
 * Common validation rule builders for form fields.
 * These can be used to create reusable validation rules.
 */

export const ValidationRules = {
  /**
   * Validates minimum length for string values
   */
  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => {
      const str = String(value ?? "");
      return str.length >= min;
    },
    message: message || `Must be at least ${min} characters`,
  }),

  /**
   * Validates maximum length for string values
   */
  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => {
      const str = String(value ?? "");
      return str.length <= max;
    },
    message: message || `Must be at most ${max} characters`,
  }),

  /**
   * Validates minimum value for numbers
   */
  min: (min: number, message?: string): ValidationRule => ({
    test: (value) => {
      const num = Number(value);
      return !Number.isNaN(num) && num >= min;
    },
    message: message || `Must be at least ${min}`,
  }),

  /**
   * Validates maximum value for numbers
   */
  max: (max: number, message?: string): ValidationRule => ({
    test: (value) => {
      const num = Number(value);
      return !Number.isNaN(num) && num <= max;
    },
    message: message || `Must be at most ${max}`,
  }),

  /**
   * Validates against a regex pattern
   */
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    test: (value) => {
      const str = String(value ?? "");
      return regex.test(str);
    },
    message,
  }),

  /**
   * Validates email format
   */
  email: (message?: string): ValidationRule => ({
    test: (value) => {
      const str = String(value ?? "");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !str || emailRegex.test(str);
    },
    message: message || "Invalid email format",
  }),

  /**
   * Validates that value matches another field
   */
  matches: (fieldName: string, fieldLabel: string): ValidationRule => ({
    test: (value, allValues) => {
      return value === allValues?.[fieldName];
    },
    message: `Must match ${fieldLabel}`,
  }),

  /**
   * Validates that value is one of the allowed options
   */
  oneOf: (options: unknown[], message?: string): ValidationRule => ({
    test: (value) => options.includes(value),
    message: message || `Must be one of: ${options.join(", ")}`,
  }),

  /**
   * Validates that value is not one of the disallowed options
   */
  notOneOf: (options: unknown[], message?: string): ValidationRule => ({
    test: (value) => !options.includes(value),
    message: message || `Cannot be one of: ${options.join(", ")}`,
  }),

  /**
   * Validates positive number (greater than 0)
   */
  positive: (message?: string): ValidationRule => ({
    test: (value) => {
      const num = Number(value);
      return !Number.isNaN(num) && num > 0;
    },
    message: message || "Must be a positive number",
  }),

  /**
   * Validates integer value
   */
  integer: (message?: string): ValidationRule => ({
    test: (value) => {
      const num = Number(value);
      return !Number.isNaN(num) && Number.isInteger(num);
    },
    message: message || "Must be an integer",
  }),

  /**
   * Custom validation function
   */
  custom: (
    test: (value: unknown, allValues?: Record<string, unknown>) => boolean,
    message: string,
  ): ValidationRule => ({
    test,
    message,
  }),
};
