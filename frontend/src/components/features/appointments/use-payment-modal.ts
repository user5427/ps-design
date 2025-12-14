import { useState, useCallback, useMemo } from "react";
import type { Appointment } from "@/schemas/appointments";
import { getAppointmentById } from "@/api/appointments";
import type { GiftCardResponse } from "@ps-design/schemas/gift-card";
import type { InitiatePaymentResponse } from "@ps-design/schemas/payments";
import { usePayAppointment } from "@/hooks/appointments";
import { useValidateGiftCard } from "@/hooks/gift-cards";
import { initiatePayment } from "@/api/payments";
import { getReadableError } from "@/utils/get-readable-error";

export type PaymentMethod = "CASH" | "STRIPE";
export type PaymentStep = "details" | "stripe-checkout";

export interface UsePaymentModalOptions {
  appointment: Appointment | null;
  onSuccess?: () => void;
  onClose: () => void;
}

export interface PaymentModalState {
  // Step management
  step: PaymentStep;

  // Form values
  paymentMethod: PaymentMethod;
  tipAmount: string;
  giftCardCode: string;

  // Validated data
  validatedGiftCard: GiftCardResponse | null;

  // Stripe state
  paymentIntent: InitiatePaymentResponse | null;

  // Errors
  giftCardError: string;
  stripeError: string;

  // Loading states
  isInitiatingPayment: boolean;
  isVerifying: boolean;
}

export interface PaymentModalCalculations {
  price: number;
  serviceName: string;
  employeeName: string;
  startTimeLabel: string;
  duration: number;
  tipAmountCents: number;
  giftCardDiscount: number;
  estimatedTotal: number;
}

export interface PaymentModalActions {
  setPaymentMethod: (method: PaymentMethod) => void;
  setTipAmount: (value: string) => void;
  setGiftCardCode: (code: string) => void;
  handleValidateGiftCard: () => Promise<void>;
  handleClearGiftCard: () => void;
  handleInitiateStripePayment: () => Promise<void>;
  handleStripeSuccess: (paymentIntentId: string) => Promise<void>;
  handleStripeError: (message: string) => void;
  handleCashPayment: () => Promise<void>;
  handleBack: () => void;
  handleClose: () => void;
  resetForm: () => void;
  setShowLoader: (show: boolean) => void;
}

export interface UsePaymentModalReturn {
  state: PaymentModalState;
  calculations: PaymentModalCalculations;
  actions: PaymentModalActions;
  mutations: {
    payMutation: ReturnType<typeof usePayAppointment>;
    validateGiftCardMutation: ReturnType<typeof useValidateGiftCard>;
  };
}

export function usePaymentModal({
  appointment,
  onSuccess,
  onClose,
}: UsePaymentModalOptions): UsePaymentModalReturn {
  const [step, setStep] = useState<PaymentStep>("details");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [tipAmount, setTipAmount] = useState<string>("");
  const [giftCardCode, setGiftCardCode] = useState<string>("");
  const [validatedGiftCard, setValidatedGiftCard] =
    useState<GiftCardResponse | null>(null);
  const [giftCardError, setGiftCardError] = useState<string>("");

  const [paymentIntent, setPaymentIntent] =
    useState<InitiatePaymentResponse | null>(null);
  const [stripeError, setStripeError] = useState<string>("");
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const payMutation = usePayAppointment();
  const validateGiftCardMutation = useValidateGiftCard();

  const calculations = useMemo<PaymentModalCalculations>(() => {
    const price = appointment?.service?.serviceDefinition?.price ?? 0;
    const serviceName =
      appointment?.service?.serviceDefinition?.name ?? "Service";
    const employeeName = appointment?.service?.employee?.name ?? "Employee";
    const startTimeLabel = appointment?.startTime ?? "";
    const duration = appointment?.service?.serviceDefinition?.duration ?? 0;

    const tipAmountCents = Math.round(parseFloat(tipAmount || "0") * 100);
    const giftCardDiscount = validatedGiftCard
      ? Math.min(validatedGiftCard.value, price)
      : 0;
    const estimatedTotal = Math.max(
      0,
      price + tipAmountCents - giftCardDiscount,
    );

    return {
      price,
      serviceName,
      employeeName,
      startTimeLabel,
      duration,
      tipAmountCents,
      giftCardDiscount,
      estimatedTotal,
    };
  }, [appointment, tipAmount, validatedGiftCard]);

  const resetForm = useCallback(() => {
    setStep("details");
    setTipAmount("");
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

  const handleTipAmountChange = useCallback((value: string) => {
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setTipAmount(value);
    }
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

  const handleInitiateStripePayment = useCallback(async () => {
    if (!appointment) return;

    setIsInitiatingPayment(true);
    setStripeError("");

    try {
      const result = await initiatePayment(appointment.id, {
        tipAmount:
          calculations.tipAmountCents > 0
            ? calculations.tipAmountCents
            : undefined,
        giftCardCode: validatedGiftCard ? giftCardCode : undefined,
      });

      setPaymentIntent(result);
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
  }, [
    appointment,
    calculations.tipAmountCents,
    validatedGiftCard,
    giftCardCode,
  ]);

  const handleStripeSuccess = useCallback(
    async (_paymentIntentId: string) => {
      if (!appointment) return;

      setIsVerifying(true);

      try {
        // Poll for status update
        let attempts = 0;
        const maxAttempts = 10;
        const interval = 1000;

        while (attempts < maxAttempts) {
          try {
            const updatedAppointment = await getAppointmentById(appointment.id);
            if (updatedAppointment.status === "PAID") {
              resetForm();
              onClose();
              onSuccess?.();
              return;
            }
          } catch {
          } finally {
            await new Promise((resolve) => setTimeout(resolve, interval));
            attempts++;
          }
        }

        setStripeError(
          "Payment successful, but appointment status update is delayed. Please refresh the page.",
        );
      } catch (error) {
        const errorMessage = getReadableError(
          error,
          "Payment processed but failed to update appointment. Please refresh the page.",
        );
        setStripeError(errorMessage);
      } finally {
        setIsVerifying(false);
      }
    },
    [appointment, resetForm, onClose, onSuccess],
  );

  const handleStripeError = useCallback((message: string) => {
    setStripeError(message);
  }, []);

  const handleCashPayment = useCallback(async () => {
    if (!appointment) return;

    try {
      await payMutation.mutateAsync({
        id: appointment.id,
        data: {
          paymentMethod:
            validatedGiftCard && calculations.estimatedTotal === 0
              ? "GIFTCARD"
              : "CASH",
          tipAmount:
            calculations.tipAmountCents > 0
              ? calculations.tipAmountCents
              : undefined,
          giftCardCode: validatedGiftCard ? giftCardCode : undefined,
        },
      });
      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      const errorMessage = getReadableError(error, "Failed to process payment");
      setStripeError(errorMessage);
    }
  }, [
    appointment,
    payMutation,
    validatedGiftCard,
    calculations,
    giftCardCode,
    resetForm,
    onClose,
    onSuccess,
  ]);

  const handleBack = useCallback(() => {
    setStep("details");
    setPaymentIntent(null);
    setStripeError("");
  }, []);

  const setShowLoader = useCallback((show: boolean) => {
    setIsVerifying(show);
  }, []);

  return {
    state: {
      step,
      paymentMethod,
      tipAmount,
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
      setTipAmount: handleTipAmountChange,
      setGiftCardCode,
      handleValidateGiftCard,
      handleClearGiftCard,
      handleInitiateStripePayment,
      handleStripeSuccess,
      handleStripeError,
      handleCashPayment,
      handleBack,
      handleClose,
      resetForm,
      setShowLoader,
    },
    mutations: {
      payMutation,
      validateGiftCardMutation,
    },
  };
}
