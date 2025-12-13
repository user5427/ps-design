import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import MoneyIcon from "@mui/icons-material/Money";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { Appointment } from "@/schemas/appointments";
import type { GiftCardResponse } from "@ps-design/schemas/gift-card";
import type { InitiatePaymentResponse } from "@ps-design/schemas/payments";
import { formatPrice } from "@/utils/price";
import dayjs from "dayjs";
import { usePayAppointment } from "@/hooks/appointments";
import { useValidateGiftCard } from "@/hooks/gift-cards";
import { getReadableError } from "@/utils/get-readable-error";
import { initiatePayment } from "@/api/payments";

// Initialize Stripe with publishable key from environment
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

type PaymentMethod = "CASH" | "STRIPE";
type PaymentStep = "details" | "stripe-checkout";

interface PayModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

const PayModalTitle = ({ step, onBack }: { step: PaymentStep; onBack?: () => void }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    {step === "stripe-checkout" && onBack && (
      <IconButton onClick={onBack} size="small" sx={{ mr: 0.5 }}>
        <ArrowBackIcon />
      </IconButton>
    )}
    <PaymentIcon color="primary" />
    {step === "details" ? "Process Payment" : "Complete Card Payment"}
  </Box>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography color="text.secondary">{label}</Typography>
    <Typography fontWeight="medium">{value}</Typography>
  </Box>
);

const PaymentMethodButton = ({
  value,
  icon,
  label,
}: {
  value: PaymentMethod;
  icon: React.ReactNode;
  label: string;
}) => (
  <ToggleButton value={value} sx={{ flex: 1, flexDirection: "column", py: 2 }}>
    {icon}
    <Typography variant="caption" sx={{ mt: 0.5 }}>
      {label}
    </Typography>
  </ToggleButton>
);

// Stripe Checkout Form Component
interface StripeCheckoutFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  isLoading: boolean;
  serverAmount: number;
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  onSuccess,
  onError,
  isLoading,
  serverAmount,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message ?? "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Note: The actual fulfillment happens via webhook + /pay endpoint
        // This client-side success is just for UX - backend is source of truth
        onSuccess(paymentIntent.id);
      } else {
        onError("Payment was not completed");
      }
    } catch (_err) {
      onError("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleStripeSubmit}>
      <Box sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Amount to charge (verified by server):
        </Typography>
        <Typography variant="h5" color="primary" fontWeight="bold">
          {formatPrice(serverAmount)}
        </Typography>
      </Box>
      <PaymentElement />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={!stripe || isProcessing || isLoading}
        startIcon={
          isProcessing || isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <CreditCardIcon />
          )
        }
        sx={{ mt: 2 }}
      >
        {isProcessing || isLoading ? "Processing..." : `Pay ${formatPrice(serverAmount)}`}
      </Button>
    </form>
  );
};

export const PayModal: React.FC<PayModalProps> = ({
  open,
  onClose,
  appointment,
  onSuccess,
}) => {
  // Step management
  const [step, setStep] = useState<PaymentStep>("details");
  
  // Form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [tipAmount, setTipAmount] = useState<string>("");
  const [giftCardCode, setGiftCardCode] = useState<string>("");
  const [validatedGiftCard, setValidatedGiftCard] =
    useState<GiftCardResponse | null>(null);
  const [giftCardError, setGiftCardError] = useState<string>("");
  
  // Stripe state
  const [paymentIntent, setPaymentIntent] = useState<InitiatePaymentResponse | null>(null);
  const [stripeError, setStripeError] = useState<string>("");
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  const payMutation = usePayAppointment();
  const validateGiftCardMutation = useValidateGiftCard();

  const price = appointment?.service?.serviceDefinition?.price ?? 0;
  const serviceName =
    appointment?.service?.serviceDefinition?.name ?? "Service";
  const employeeName = appointment?.service?.employee?.name ?? "Employee";
  const startTimeLabel = appointment
    ? dayjs(appointment.startTime).format("YYYY-MM-DD HH:mm")
    : "";
  const duration = appointment?.service?.serviceDefinition?.duration ?? 0;

  // Client-side estimates (for display before server confirmation)
  const tipAmountCents = Math.round(parseFloat(tipAmount || "0") * 100);
  const giftCardDiscount = validatedGiftCard
    ? Math.min(validatedGiftCard.value, price)
    : 0;
  const estimatedTotal = Math.max(0, price + tipAmountCents - giftCardDiscount);

  const handlePaymentMethodChange = (
    _: React.MouseEvent<HTMLElement>,
    newMethod: PaymentMethod | null,
  ) => {
    if (newMethod) {
      setPaymentMethod(newMethod);
      setStripeError("");
    }
  };

  const handleTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setTipAmount(value);
    }
  };

  const handleValidateGiftCard = async () => {
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
  };

  const handleClearGiftCard = () => {
    setGiftCardCode("");
    setValidatedGiftCard(null);
    setGiftCardError("");
  };

  /**
   * Initiate Stripe payment - server calculates final amount and creates PaymentIntent
   * This is the correct Stripe architecture where server is source of truth
   */
  const handleInitiateStripePayment = async () => {
    if (!appointment) return;

    setIsInitiatingPayment(true);
    setStripeError("");

    try {
      const result = await initiatePayment(appointment.id, {
        tipAmount: tipAmountCents > 0 ? tipAmountCents : undefined,
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
  };

  /**
   * Complete payment after Stripe confirmation
   * This finalizes the appointment as paid in our system
   */
  const handleStripeSuccess = async (paymentIntentId: string) => {
    if (!appointment) return;

    try {
      await payMutation.mutateAsync({
        id: appointment.id,
        data: {
          paymentMethod: "STRIPE",
          tipAmount: paymentIntent?.breakdown.tipAmount,
          giftCardCode: validatedGiftCard ? giftCardCode : undefined,
          paymentIntentId,
        },
      });
      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      // Payment succeeded in Stripe but failed to record locally
      // This is handled by webhook as backup
      const errorMessage = getReadableError(
        error,
        "Payment processed but failed to update appointment. Please refresh the page.",
      );
      setStripeError(errorMessage);
    }
  };

  /**
   * Handle cash or gift-card-only payments
   */
  const handleCashPayment = async () => {
    if (!appointment) return;

    try {
      await payMutation.mutateAsync({
        id: appointment.id,
        data: {
          paymentMethod:
            validatedGiftCard && estimatedTotal === 0 ? "GIFTCARD" : "CASH",
          tipAmount: tipAmountCents > 0 ? tipAmountCents : undefined,
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
  };

  const handleBack = () => {
    setStep("details");
    setPaymentIntent(null);
    setStripeError("");
  };

  const resetForm = () => {
    setStep("details");
    setTipAmount("");
    setPaymentMethod("CASH");
    setGiftCardCode("");
    setValidatedGiftCard(null);
    setGiftCardError("");
    setPaymentIntent(null);
    setStripeError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!appointment) return null;

  // Stripe checkout step
  if (step === "stripe-checkout" && paymentIntent && stripePromise) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <PayModalTitle step={step} onBack={handleBack} />
        </DialogTitle>
        <DialogContent>
          <Stack sx={{ py: 2 }} spacing={3}>
            {stripeError && (
              <Alert severity="error">{stripeError}</Alert>
            )}
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentIntent.clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <StripeCheckoutForm
                onSuccess={handleStripeSuccess}
                onError={(msg) => setStripeError(msg)}
                isLoading={payMutation.isPending}
                serverAmount={paymentIntent.finalAmount}
              />
            </Elements>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleBack} disabled={payMutation.isPending}>
            Back
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Details step (default)
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <PayModalTitle step={step} />
      </DialogTitle>
      <DialogContent>
        <Stack sx={{ py: 2 }} spacing={3}>
          {/* Appointment Details */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Appointment Details
            </Typography>
            <Stack spacing={1}>
              <DetailRow label="Customer" value={appointment.customerName} />
              <DetailRow label="Service" value={serviceName} />
              <DetailRow label="Employee" value={employeeName} />
              <DetailRow label="Date" value={startTimeLabel} />
              <DetailRow label="Duration" value={`${duration} min`} />
            </Stack>
          </Box>

          <Divider />

          {/* Gift Card */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Gift Card (Optional)
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                value={giftCardCode}
                onChange={(e) => setGiftCardCode(e.target.value)}
                placeholder="Enter code"
                fullWidth
                size="small"
                disabled={!!validatedGiftCard}
                InputProps={{
                  endAdornment: validatedGiftCard && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearGiftCard}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {!validatedGiftCard && (
                <Button
                  variant="outlined"
                  onClick={handleValidateGiftCard}
                  disabled={
                    !giftCardCode.trim() || validateGiftCardMutation.isPending
                  }
                >
                  {validateGiftCardMutation.isPending ? "..." : "Apply"}
                </Button>
              )}
            </Box>
            {giftCardError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {giftCardError}
              </Alert>
            )}
            {validatedGiftCard && (
              <Alert
                severity="success"
                icon={<CheckCircleIcon fontSize="inherit" />}
                sx={{ mt: 1 }}
              >
                Gift card applied: {formatPrice(validatedGiftCard.value)}{" "}
                discount
              </Alert>
            )}
          </Box>

          <Divider />

          {/* Tip */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Add Tip (Optional)
            </Typography>
            <TextField
              value={tipAmount}
              onChange={handleTipChange}
              placeholder="0.00"
              fullWidth
              type="text"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">€</InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Divider />

          {/* Totals */}
          <Box>
            <Stack spacing={1}>
              <DetailRow label="Service" value={formatPrice(price)} />
              {giftCardDiscount > 0 && (
                <DetailRow
                  label="Gift Card Discount"
                  value={`-${formatPrice(giftCardDiscount)}`}
                />
              )}
              {tipAmountCents > 0 && (
                <DetailRow label="Tip" value={formatPrice(tipAmountCents)} />
              )}
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6">
                  {estimatedTotal === 0 ? "Fully Covered" : "Estimated Total"}
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatPrice(estimatedTotal)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Payment Method - only show if remaining amount > 0 */}
          {estimatedTotal > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Payment Method
              </Typography>
              <ToggleButtonGroup
                value={paymentMethod}
                exclusive
                onChange={handlePaymentMethodChange}
                fullWidth
                color="primary"
              >
                <PaymentMethodButton
                  value="CASH"
                  icon={<MoneyIcon />}
                  label="Cash"
                />
                <PaymentMethodButton
                  value="STRIPE"
                  icon={<CreditCardIcon />}
                  label="Card"
                />
              </ToggleButtonGroup>

              {/* Error display */}
              {stripeError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {stripeError}
                </Alert>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={payMutation.isPending || isInitiatingPayment}>
          Cancel
        </Button>
        
        {/* Cash or fully-covered payment */}
        {(paymentMethod === "CASH" || estimatedTotal === 0) && (
          <Button
            variant="contained"
            color="primary"
            startIcon={
              payMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PaymentIcon />
              )
            }
            onClick={handleCashPayment}
            disabled={payMutation.isPending}
          >
            {payMutation.isPending ? "Processing..." : "Confirm Payment"}
          </Button>
        )}

        {/* Stripe payment - proceed to checkout */}
        {paymentMethod === "STRIPE" && estimatedTotal > 0 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={
              isInitiatingPayment ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CreditCardIcon />
              )
            }
            onClick={handleInitiateStripePayment}
            disabled={isInitiatingPayment || estimatedTotal < 50}
          >
            {isInitiatingPayment ? "Preparing..." : "Continue to Card Payment"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
