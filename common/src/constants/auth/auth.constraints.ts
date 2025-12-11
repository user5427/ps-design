/**
 * Authentication constraints and validation rules
 * Centralized constants for auth schema validation
 */

export const AUTH_CONSTRAINTS = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MIN_LENGTH_MESSAGE: "Password must be at least 8 characters",
  },
  EMAIL: {
    INVALID_FORMAT_MESSAGE: "Invalid email format",
  },
} as const;
