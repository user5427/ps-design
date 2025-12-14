// Shared payment-related types used across appointments and orders

export type PaymentMethod = "CASH" | "STRIPE";
export type PaymentStep = "details" | "stripe-checkout";
