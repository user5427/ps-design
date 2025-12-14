import { useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { formatPrice } from "@/utils/price";

interface StripeCheckoutFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  isLoading: boolean;
  serverAmount: number;
}

export const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
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
        {isProcessing || isLoading
          ? "Processing..."
          : `Pay ${formatPrice(serverAmount)}`}
      </Button>
    </form>
  );
};
