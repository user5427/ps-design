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
import type { Appointment } from "@/schemas/appointments";
import type { GiftCardResponse } from "@ps-design/schemas/gift-card";
import { formatPrice } from "@/utils/price";
import dayjs from "dayjs";
import { usePayAppointment } from "@/hooks/appointments";
import { useValidateGiftCard } from "@/hooks/gift-cards";

type PaymentMethod = "CASH" | "STRIPE";

interface PayModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

const PayModalTitle = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <PaymentIcon color="primary" />
    Process Payment
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

export const PayModal: React.FC<PayModalProps> = ({
  open,
  onClose,
  appointment,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [tipAmount, setTipAmount] = useState<string>("");
  const [giftCardCode, setGiftCardCode] = useState<string>("");
  const [validatedGiftCard, setValidatedGiftCard] = useState<GiftCardResponse | null>(null);
  const [giftCardError, setGiftCardError] = useState<string>("");

  const payMutation = usePayAppointment();
  const validateGiftCardMutation = useValidateGiftCard();

  if (!appointment) return null;

  const price = appointment.service?.serviceDefinition?.price ?? 0;
  const serviceName = appointment.service?.serviceDefinition?.name ?? "Service";
  const employeeName = appointment.service?.employee?.name ?? "Employee";
  const startTimeLabel = dayjs(appointment.startTime).format(
    "YYYY-MM-DD HH:mm",
  );
  const duration = appointment.service?.serviceDefinition?.duration ?? 0;

  const tipAmountCents = Math.round(parseFloat(tipAmount || "0") * 100);
  const giftCardDiscount = validatedGiftCard
    ? Math.min(validatedGiftCard.value, price)
    : 0;
  const total = Math.max(0, price + tipAmountCents - giftCardDiscount);

  const handlePaymentMethodChange = (
    _: React.MouseEvent<HTMLElement>,
    newMethod: PaymentMethod | null,
  ) => {
    if (newMethod) {
      setPaymentMethod(newMethod);
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
      const giftCard = await validateGiftCardMutation.mutateAsync(giftCardCode.trim());
      setValidatedGiftCard(giftCard);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Invalid gift card";
      setGiftCardError(errorMessage);
      setValidatedGiftCard(null);
    }
  };

  const handleClearGiftCard = () => {
    setGiftCardCode("");
    setValidatedGiftCard(null);
    setGiftCardError("");
  };

  const handleSubmit = async () => {
    await payMutation.mutateAsync({
      id: appointment.id,
      data: {
        paymentMethod: validatedGiftCard && total === 0 ? "GIFTCARD" : paymentMethod,
        tipAmount: tipAmountCents > 0 ? tipAmountCents : undefined,
        giftCardCode: validatedGiftCard ? giftCardCode : undefined,
      },
    });
    resetForm();
    onClose();
    onSuccess?.();
  };

  const resetForm = () => {
    setTipAmount("");
    setPaymentMethod("CASH");
    setGiftCardCode("");
    setValidatedGiftCard(null);
    setGiftCardError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <PayModalTitle />
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
                  disabled={!giftCardCode.trim() || validateGiftCardMutation.isPending}
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
                Gift card applied: {formatPrice(validatedGiftCard.value)} discount
              </Alert>
            )}
          </Box>

          <Divider />

          {/* Payment Method - only show if remaining amount > 0 */}
          {total > 0 && (
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
            </Box>
          )}

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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
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
                  {total === 0 ? "Fully Covered" : "To Pay"}
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatPrice(total)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={payMutation.isPending}>
          Cancel
        </Button>
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
          onClick={handleSubmit}
          disabled={payMutation.isPending}
        >
          {payMutation.isPending ? "Processing..." : "Confirm Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
