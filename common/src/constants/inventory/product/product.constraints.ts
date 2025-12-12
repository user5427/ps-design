/**
 * Product constraints and validation rules
 * Centralized constants for product schema validation
 */

export const PRODUCT_CONSTRAINTS = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    MIN_LENGTH_MESSAGE: "Name must be at least 1 character",
    MAX_LENGTH_MESSAGE: "Name must be at most 100 characters",
  },
  DESCRIPTION: {
    MAX_LENGTH: 500,
    MAX_LENGTH_MESSAGE: "Description must be at most 500 characters",
  },
} as const;
