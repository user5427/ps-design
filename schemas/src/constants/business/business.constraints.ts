/**
 * Business constraints and validation rules
 * Centralized constants for business schema validation
 */

export const BUSINESS_CONSTRAINTS = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    MIN_LENGTH_MESSAGE: "Name must be at least 1 character",
    MAX_LENGTH_MESSAGE: "Name must be at most 100 characters",
  },
} as const;
