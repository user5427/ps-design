import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import dayjs from "dayjs";

import type { Appointment } from "@/schemas/appointments";
import { MINIMUM_STRIPE_PAYMENT_AMOUNT } from "@ps-design/schemas/payments";
import { usePaymentModal } from "./use-payment-modal";
import {
  DetailRow,
  PayModalTitle,
  StripeCheckoutForm,
  GiftCardSection,
  TipSection,
  PaymentSummarySection,
} from "@/components/features/payments";

// Initialize Stripe with publishable key from environment
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

interface PayModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

export const PayModal: React.FC<PayModalProps> = ({
  open,
  onClose,
  appointment,
  onSuccess,
}) => {
  const { state, calculations, actions, mutations } = usePaymentModal({
    appointment,
    onSuccess,
    onClose,
  });

  if (!appointment) return null;

  const startTimeLabel = dayjs(appointment.startTime).format(
    "YYYY-MM-DD HH:mm",
  );

  // Verification step (polling)
  if (state.isVerifying) {
    return (
      <Dialog open={open} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: "center", py: 8 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={48} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Verifying Payment
              </Typography>
              <Typography color="text.secondary">
                Please wait while we confirm the transaction...
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  // Stripe checkout step
  if (
    state.step === "stripe-checkout" &&
    state.paymentIntent &&
    stripePromise
  ) {
    return (
      <Dialog open={open} onClose={actions.handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <PayModalTitle step={state.step} onBack={actions.handleBack} />
        </DialogTitle>
        <DialogContent>
          <Stack sx={{ py: 2 }} spacing={3}>
            {state.stripeError && (
              <Alert severity="error">{state.stripeError}</Alert>
            )}
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: state.paymentIntent.clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <StripeCheckoutForm
                onSuccess={actions.handleStripeSuccess}
                onError={actions.handleStripeError}
                isLoading={mutations.payMutation.isPending}
                serverAmount={state.paymentIntent.finalAmount}
              />
            </Elements>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={actions.handleBack}
            disabled={mutations.payMutation.isPending}
          >
            Back
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Details step (default)
  return (
    <Dialog open={open} onClose={actions.handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <PayModalTitle step={state.step} />
      </DialogTitle>
      <DialogContent>
        <Stack sx={{ py: 2 }} spacing={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Appointment Details
            </Typography>
            <Stack spacing={1}>
              <DetailRow label="Customer" value={appointment.customerName} />
              <DetailRow label="Service" value={calculations.serviceName} />
              <DetailRow label="Employee" value={calculations.employeeName} />
              <DetailRow label="Date" value={startTimeLabel} />
              <DetailRow
                label="Duration"
                value={`${calculations.duration} min`}
              />
            </Stack>
          </Box>

          <Divider />

          <GiftCardSection
            giftCardCode={state.giftCardCode}
            onGiftCardCodeChange={actions.setGiftCardCode}
            validatedGiftCard={state.validatedGiftCard}
            giftCardError={state.giftCardError}
            onValidate={actions.handleValidateGiftCard}
            onClear={actions.handleClearGiftCard}
            isValidating={mutations.validateGiftCardMutation.isPending}
          />

          <Divider />

          <TipSection
            tipAmount={state.tipAmount}
            onTipChange={actions.setTipAmount}
          />

          <Divider />

          <PaymentSummarySection
            price={calculations.price}
            tipAmountCents={calculations.tipAmountCents}
            giftCardDiscount={calculations.giftCardDiscount}
            estimatedTotal={calculations.estimatedTotal}
            paymentMethod={state.paymentMethod}
            onPaymentMethodChange={actions.setPaymentMethod}
            stripeError={state.stripeError}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={actions.handleClose}
          disabled={
            mutations.payMutation.isPending || state.isInitiatingPayment
          }
        >
          Cancel
        </Button>

        {(state.paymentMethod === "CASH" ||
          calculations.estimatedTotal === 0) && (
            <Button
              variant="contained"
              color="primary"
              startIcon={
                mutations.payMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <PaymentIcon />
                )
              }
              onClick={actions.handleCashPayment}
              disabled={mutations.payMutation.isPending}
            >
              {mutations.payMutation.isPending
                ? "Processing..."
                : "Confirm Payment"}
            </Button>
          )}

        {state.paymentMethod === "STRIPE" &&
          calculations.estimatedTotal > 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={
                state.isInitiatingPayment ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CreditCardIcon />
                )
              }
              onClick={actions.handleInitiateStripePayment}
              disabled={
                state.isInitiatingPayment ||
                calculations.estimatedTotal < MINIMUM_STRIPE_PAYMENT_AMOUNT
              }
            >
              {state.isInitiatingPayment
                ? "Preparing..."
                : "Continue to Card Payment"}
            </Button>
          )}
      </DialogActions>
    </Dialog>
  );
};
