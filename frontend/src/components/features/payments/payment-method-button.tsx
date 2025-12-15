import { ToggleButton, Typography } from "@mui/material";
import type { PaymentMethod } from "@/hooks/payments";

interface PaymentMethodButtonProps {
  value: PaymentMethod;
  icon: React.ReactNode;
  label: string;
}

export const PaymentMethodButton: React.FC<PaymentMethodButtonProps> = ({
  value,
  icon,
  label,
}) => (
  <ToggleButton value={value} sx={{ flex: 1, flexDirection: "column", py: 2 }}>
    {icon}
    <Typography variant="caption" sx={{ mt: 0.5 }}>
      {label}
    </Typography>
  </ToggleButton>
);
