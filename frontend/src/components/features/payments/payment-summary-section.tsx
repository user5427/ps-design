import {
  Box,
  Stack,
  Typography,
  Divider,
  ToggleButtonGroup,
  Alert,
  TextField,
} from "@mui/material";
import MoneyIcon from "@mui/icons-material/Money";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import type { PaymentMethod } from "@/hooks/payments";
import { formatPrice } from "@/utils/price";
import { DetailRow } from "./detail-row";
import { PaymentMethodButton } from "./payment-method-button";

interface PaymentSummarySectionProps {
  price: number;
  tipAmountCents: number;
  giftCardDiscount: number;
  discountAmount?: number;
  discountName?: string;
  taxAmount?: number;
  estimatedTotal: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  stripeError: string;
  partialAmountCents?: number;
  onPartialAmountChange?: (amountCents: number) => void;
}

export const PaymentSummarySection: React.FC<PaymentSummarySectionProps> = ({
  price,
  tipAmountCents,
  giftCardDiscount,
  discountAmount = 0,
  discountName,
  taxAmount = 0,
  estimatedTotal,
  paymentMethod,
  onPaymentMethodChange,
  stripeError,
  partialAmountCents,
  onPartialAmountChange,
}) => {
  const handlePaymentMethodChange = (
    _: React.MouseEvent<HTMLElement>,
    newMethod: PaymentMethod | null,
  ) => {
    if (newMethod) {
      onPaymentMethodChange(newMethod);
    }
  };

  return (
    <>
      {/* Totals */}
      <Box>
        <Stack spacing={1}>
          <DetailRow label="Service" value={formatPrice(price)} />
          {discountAmount > 0 && (
            <DetailRow
              label={discountName ? `Discount (${discountName})` : "Discount"}
              value={`-${formatPrice(discountAmount)}`}
            />
          )}
          {giftCardDiscount > 0 && (
            <DetailRow
              label="Gift Card Discount"
              value={`-${formatPrice(giftCardDiscount)}`}
            />
          )}
          {taxAmount > 0 && (
            <DetailRow label="Tax" value={formatPrice(taxAmount)} />
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

      {onPartialAmountChange && estimatedTotal > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Amount to Pay Now
          </Typography>
          <TextField
            type="number"
            size="small"
            inputProps={{ min: 0, step: 0.01 }}
            value={
              (partialAmountCents ?? estimatedTotal) > 0
                ? (partialAmountCents ?? estimatedTotal) / 100
                : ""
            }
            onChange={(event) => {
              const rawValue = event.target.value;
              const numeric = parseFloat(rawValue.replace(",", "."));
              const cents = Number.isNaN(numeric)
                ? 0
                : Math.round(numeric * 100);
              onPartialAmountChange(cents);
            }}
            fullWidth
          />
          <Typography variant="caption" color="text.secondary">
            Max: {formatPrice(estimatedTotal)}
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Payment Method - only show if remaining amount > 0 */}
      {estimatedTotal > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
    </>
  );
};
