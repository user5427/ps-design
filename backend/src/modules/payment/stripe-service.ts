import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set. Stripe payments will not work.");
}

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
    })
  : null;

export interface CreatePaymentIntentParams {
  amount: number; // cents
  currency?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
}

export interface RefundPaymentParams {
  paymentIntentId: string;
  amount?: number; // cents, if undefined refunds full amount
}

export interface RefundPaymentResult {
  refundId: string;
  status: string;
  amount: number;
}

export const stripeService = {
  /**
   * Create a PaymentIntent for collecting payment
   * @param params - amount in cents, currency (default EUR)
   * @returns paymentIntentId and clientSecret for frontend
   */
  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<CreatePaymentIntentResult> {
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency ?? "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: params.metadata,
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Failed to create payment intent");
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  },

  /**
   * Refund a payment by PaymentIntent ID
   * @param params - paymentIntentId and optional amount to refund
   * @returns refund details
   */
  async refundPayment(
    params: RefundPaymentParams,
  ): Promise<RefundPaymentResult> {
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: params.paymentIntentId,
    };

    if (params.amount !== undefined) {
      refundParams.amount = params.amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      refundId: refund.id,
      status: refund.status ?? "unknown",
      amount: refund.amount,
    };
  },

  /**
   * Retrieve a PaymentIntent to check its status
   */
  async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    return stripe.paymentIntents.retrieve(paymentIntentId);
  },

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return stripe !== null;
  },
};

export type StripeService = typeof stripeService;
