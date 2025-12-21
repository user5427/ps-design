/**
 * Stock Change constraints and validation rules
 * Centralized constants for stock change schema validation
 */

export const STOCK_CHANGE_CONSTRAINTS = {
  TYPE: {
    SUPPLY: "SUPPLY",
    ADJUSTMENT: "ADJUSTMENT",
    WASTE: "WASTE",
  } as const,
  QUANTITY: {
    SUPPLY_MESSAGE: "Quantity must be positive for Supply",
    WASTE_MESSAGE: "Quantity must be negative for Waste",
    ADJUSTMENT_MESSAGE: "Quantity cannot be zero",
  },
  EXPIRATION_DATE: {
    MUST_BE_FUTURE_MESSAGE: "Expiration date must be in the future",
  },
} as const;
