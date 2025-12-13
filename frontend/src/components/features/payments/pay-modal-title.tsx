import { Box, IconButton } from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { PaymentStep } from "@/hooks/payments";

interface PayModalTitleProps {
  step: PaymentStep;
  onBack?: () => void;
}

export const PayModalTitle: React.FC<PayModalTitleProps> = ({
  step,
  onBack,
}) => (
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
