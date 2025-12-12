/**
 * Price utility functions for converting between cents (stored) and display format (euros).
 * All prices are stored as integers in cents to avoid floating-point precision issues.
 */

/**
 * Converts cents to display format (euros).
 * @param cents - Price in cents (integer)
 * @returns Price in euros (e.g., 1299 -> 12.99)
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Converts euros to cents.
 * @param euros - Price in euros
 * @returns Price in cents (integer)
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Formats cents as a display string with currency symbol.
 * @param cents - Price in cents (integer)
 * @param currency - Currency symbol (default: "€")
 * @returns Formatted price string (e.g., 1299 -> "12.99€")
 */
export function formatPrice(cents: number, currency = "€"): string {
  return `${centsToEuros(cents).toFixed(2)}${currency}`;
}

/**
 * Parses a display value (euros) to cents.
 * Handles string or number input.
 * @param value - Price in euros (string or number)
 * @returns Price in cents (integer), or 0 if invalid
 */
export function parseDisplayToCents(value: string | number): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return 0;
  return eurosToCents(num);
}
