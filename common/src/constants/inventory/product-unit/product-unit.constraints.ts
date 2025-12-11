/**
 * Product Unit constraints and validation rules
 * Centralized constants for product unit schema validation
 */

export const PRODUCT_UNIT_CONSTRAINTS = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    MIN_LENGTH_MESSAGE: "Name must be at least 1 character",
    MAX_LENGTH_MESSAGE: "Name must be at most 100 characters",
  },
  SYMBOL: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 10,
    MIN_LENGTH_MESSAGE: "Symbol must be at least 1 character",
    MAX_LENGTH_MESSAGE: "Symbol must be at most 10 characters",
  },
} as const;
