/**
 * Validation utilities for form fields
 */

/**
 * A validation rule function that validates a field value.
 * Returns undefined if valid, or an error message string if invalid.
 * 
 * @param value - The current field value
 * @param allValues - Optional: all form values for cross-field validation
 * @returns Error message string if invalid, undefined if valid
 * 
 * @example
 * ```tsx
 * const emailValidator: ValidationRule = (value) => {
 *   if (!value) return undefined;
 *   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 *   return emailRegex.test(String(value)) ? undefined : "Invalid email";
 * };
 * ```
 */
export type ValidationRule = (value: unknown, allValues?: Record<string, unknown>) => string | undefined;

/**
 * Creates a minimum length validator
 * @param min - Minimum length required
 * @returns ValidationRule function
 */
export const minLengthValidator = (min: number): ValidationRule => (value) => {
  if (!value) return undefined;
  return String(value).length >= min ? undefined : `Must be at least ${min} characters`;
};

/**
 * Creates a maximum length validator
 * @param max - Maximum length allowed
 * @returns ValidationRule function
 */
export const maxLengthValidator = (max: number): ValidationRule => (value) => {
  if (!value) return undefined;
  return String(value).length <= max ? undefined : `Must be no more than ${max} characters`;
};

/**
 * Validates email format
 */
export const emailValidator: ValidationRule = (value) => {
  if (!value) return undefined;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(value)) ? undefined : "Invalid email address";
};

/**
 * Validates minimum number value
 */
export const minValueValidator = (min: number): ValidationRule => (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return num >= min ? undefined : `Must be at least ${min}`;
};

/**
 * Validates maximum number value
 */
export const maxValueValidator = (max: number): ValidationRule => (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return num <= max ? undefined : `Must be no more than ${max}`;
};

/**
 * Creates a pattern matching validator (regex)
 */
export const patternValidator = (pattern: RegExp, message: string): ValidationRule => (value) => {
  if (!value) return undefined;
  return pattern.test(String(value)) ? undefined : message;
};
