import type { GiftCardResponse } from "@ps-design/schemas/gift-card";
import type { OrderResponse } from "@ps-design/schemas/order/order";
import type { InitiatePaymentResponse } from "@ps-design/schemas/payments";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { getOrder, initiateOrderStripePayment } from "@/api/orders";
import { useValidateGiftCard } from "@/hooks/gift-cards";
import { floorKeys } from "@/hooks/orders/floor-hooks";
import { orderKeys, usePayOrder } from "@/hooks/orders/order-hooks";
import type { PaymentMethod, PaymentStep } from "@/hooks/payments";
import { getReadableError } from "@/utils/get-readable-error";

// Polling configuration for payment status verification
const PAYMENT_POLLING_MAX_ATTEMPTS = 10;
const PAYMENT_POLLING_INITIAL_INTERVAL_MS = 1000;
const PAYMENT_POLLING_BACKOFF_MULTIPLIER = 1.5;

export interface UseOrderPaymentModalOptions {
  order: OrderResponse | null;
  onSuccess?: () => void;
  onClose: () => void;
}

export interface OrderPaymentModalState {
  step: PaymentStep;
  paymentMethod: PaymentMethod;
  giftCardCode: string;
  validatedGiftCard: GiftCardResponse | null;
  paymentIntent: InitiatePaymentResponse | null;
  giftCardError: string;
  stripeError: string;
  isInitiatingPayment: boolean;
  isVerifying: boolean;
}

export interface OrderPaymentModalCalculations {
  price: number;
  giftCardDiscount: number;
  estimatedTotal: number;
}

export interface OrderPaymentModalActions {
  setPaymentMethod: (method: PaymentMethod) => void;
  setGiftCardCode: (code: string) => void;
  handleValidateGiftCard: () => Promise<void>;
  handleClearGiftCard: () => void;
  handleInitiateStripePayment: () => Promise<void>;
  handleStripeSuccess: (paymentIntentId: string) => Promise<void>;
  handleStripeError: (message: string) => void;
  handleCashPayment: () => Promise<void>;
  handleBack: () => void;
  handleClose: () => void;
}

export interface UseOrderPaymentModalReturn {
  state: OrderPaymentModalState;
  calculations: OrderPaymentModalCalculations;
  actions: OrderPaymentModalActions;
  mutations: {
    payMutation: ReturnType<typeof usePayOrder>;
    validateGiftCardMutation: ReturnType<typeof useValidateGiftCard>;
  };
}

export function useOrderPaymentModal({
  order,
  onSuccess,
  onClose,
}: UseOrderPaymentModalOptions): UseOrderPaymentModalReturn {
  const [step, setStep] = useState<PaymentStep>("details");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [giftCardCode, setGiftCardCode] = useState<string>("");
  const [validatedGiftCard, setValidatedGiftCard] =
    useState<GiftCardResponse | null>(null);
  const [giftCardError, setGiftCardError] = useState<string>("");
  const [paymentIntent, setPaymentIntent] =
    useState<InitiatePaymentResponse | null>(null);
  const [stripeError, setStripeError] = useState<string>("");
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const orderId = order?.id ?? "";
  const payMutation = usePayOrder(orderId);
  const validateGiftCardMutation = useValidateGiftCard();
  const queryClient = useQueryClient();

  const calculations = useMemo<OrderPaymentModalCalculations>(() => {
    if (!order) {
      return {
        price: 0,
        giftCardDiscount: 0,
        estimatedTotal: 0,
      };
    }

    const totalPaid = (order.payments ?? [])
      .filter((p) => !p.isRefund)
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunded = (order.payments ?? [])
      .filter((p) => p.isRefund)
      .reduce((sum, p) => sum + p.amount, 0);

    const netPaid = totalPaid - totalRefunded;
    const remainingMajor = Math.max(0, order.totalAmount - netPaid);

    const price = Math.round(remainingMajor * 100); // cents
    const giftCardDiscount = validatedGiftCard
      ? Math.min(validatedGiftCard.value, price)
      : 0;

    const estimatedTotal = Math.max(0, price - giftCardDiscount);

    return {
      price,
      giftCardDiscount,
      estimatedTotal,
    };
  }, [order, validatedGiftCard]);

  const resetForm = useCallback(() => {
    setStep("details");
    setPaymentMethod("CASH");
    setGiftCardCode("");
    setValidatedGiftCard(null);
    setGiftCardError("");
    setPaymentIntent(null);
    setStripeError("");
    setIsVerifying(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handlePaymentMethodChange = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method);
    setStripeError("");
  }, []);

  const handleValidateGiftCard = useCallback(async () => {
    if (!giftCardCode.trim()) return;

    setGiftCardError("");
    try {
      const giftCard = await validateGiftCardMutation.mutateAsync(
        giftCardCode.trim(),
      );
      setValidatedGiftCard(giftCard);
    } catch (error: unknown) {
      const errorMessage = getReadableError(error, "Invalid gift card");
      setGiftCardError(errorMessage);
      setValidatedGiftCard(null);
    }
  }, [giftCardCode, validateGiftCardMutation]);

  const handleClearGiftCard = useCallback(() => {
    setGiftCardCode("");
    setValidatedGiftCard(null);
    setGiftCardError("");
  }, []);

  const applyGiftCardIfNeeded = useCallback(async () => {
    if (!order || !validatedGiftCard || !giftCardCode.trim()) return;

    await payMutation.mutateAsync({
      paymentMethod: "GIFT_CARD",
      amount: 0,
      giftCardCode: giftCardCode.trim(),
    });

    // After applying the gift card, clear it from the form
    setValidatedGiftCard(null);
    setGiftCardCode("");
  }, [order, validatedGiftCard, giftCardCode, payMutation]);

  const handleInitiateStripePayment = useCallback(async () => {
    if (!order) return;

    setIsInitiatingPayment(true);
    setStripeError("");

    try {
      // If a gift card is present, apply it first so the
      // PaymentIntent is created for the remaining amount only.
      await applyGiftCardIfNeeded();

      const result = await initiateOrderStripePayment(order.id);

      setPaymentIntent({
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        finalAmount: Math.round(result.finalAmount * 100),
        breakdown: {
          servicePrice: Math.round(result.finalAmount * 100),
          tipAmount: 0,
          giftCardDiscount: 0,
        },
      });
      setStep("stripe-checkout");
    } catch (error) {
      const errorMessage = getReadableError(
        error,
        "Failed to initialize card payment",
      );
      setStripeError(errorMessage);
    } finally {
      setIsInitiatingPayment(false);
    }
  }, [order, applyGiftCardIfNeeded]);

  const handleStripeSuccess = useCallback(
    async (_paymentIntentId: string) => {
      if (!order) return;

      setIsVerifying(true);

      try {
        // Poll for status update (via webhook handler updating the order)
        // Using exponential backoff to reduce server load
        let attempts = 0;
        let currentInterval = PAYMENT_POLLING_INITIAL_INTERVAL_MS;

        while (attempts < PAYMENT_POLLING_MAX_ATTEMPTS) {
          try {
            const updatedOrder = await getOrder(order.id);

            queryClient.setQueryData(orderKeys.order(order.id), updatedOrder);
            queryClient.invalidateQueries({
              queryKey: floorKeys.floorPlan(),
            });

            if (updatedOrder.status === "PAID") {
              resetForm();
              onClose();
              onSuccess?.();
              return;
            }
          } catch (error) {
            console.error("Polling order status failed:", error);
          } finally {
            await new Promise((resolve) =>
              setTimeout(resolve, currentInterval),
            );
            attempts++;
            // Apply exponential backoff for subsequent attempts
            currentInterval = Math.round(
              currentInterval * PAYMENT_POLLING_BACKOFF_MULTIPLIER,
            );
          }
        }

        setStripeError(
          "Payment successful, but order status update is delayed. Please refresh the page.",
        );
      } catch (error) {
        const errorMessage = getReadableError(
          error,
          "Payment processed but failed to update order. Please refresh the page.",
        );
        setStripeError(errorMessage);
      } finally {
        setIsVerifying(false);
      }
    },
    [order, queryClient, resetForm, onClose, onSuccess],
  );

  const handleStripeError = useCallback((message: string) => {
    setStripeError(message);
  }, []);

  const handleCashPayment = useCallback(async () => {
    if (!order) return;

    try {
      // First apply any gift card, which will reduce the remaining amount
      await applyGiftCardIfNeeded();

      // Then pay the remaining amount in cash
      const finalAmountMajor = calculations.estimatedTotal / 100;

      if (finalAmountMajor > 0) {
        await payMutation.mutateAsync({
          paymentMethod: "CASH",
          amount: finalAmountMajor,
        });
      }

      queryClient.invalidateQueries({ queryKey: floorKeys.floorPlan() });

      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      const errorMessage = getReadableError(error, "Failed to process payment");
      setStripeError(errorMessage);
    }
  }, [
    order,
    applyGiftCardIfNeeded,
    calculations.estimatedTotal,
    payMutation,
    queryClient,
    resetForm,
    onClose,
    onSuccess,
  ]);

  const handleBack = useCallback(() => {
    setStep("details");
    setPaymentIntent(null);
    setStripeError("");
  }, []);

  return {
    state: {
      step,
      paymentMethod,
      giftCardCode,
      validatedGiftCard,
      paymentIntent,
      giftCardError,
      stripeError,
      isInitiatingPayment,
      isVerifying,
    },
    calculations,
    actions: {
      setPaymentMethod: handlePaymentMethodChange,
      setGiftCardCode,
      handleValidateGiftCard,
      handleClearGiftCard,
      handleInitiateStripePayment,
      handleStripeSuccess,
      handleStripeError,
      handleCashPayment,
      handleBack,
      handleClose,
    },
    mutations: {
      payMutation,
      validateGiftCardMutation,
    },
  };
}
