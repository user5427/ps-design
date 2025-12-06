import { Alert } from "@mui/material";
import type React from "react";

export interface FormAlertProps {
  message: string | React.ReactNode;
  severity?: "error" | "warning" | "info" | "success";
  sx?: object;
}

export const FormAlert: React.FC<FormAlertProps> = ({
  message,
  severity = "error",
  sx = {},
}) => (
  <Alert severity={severity} sx={{ mb: 2, ...sx }}>
    {message}
  </Alert>
);
