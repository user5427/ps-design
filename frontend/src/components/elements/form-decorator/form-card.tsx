/**
 * FormCard Component
 * 
 * Reusable wrapper that renders a FormBuilder component in a card with submit button.
 * Good for inline forms (login, password change, etc) that don't need a modal dialog.
 * 
 * @example
 * ```tsx
 * const loginForm = createForm({ children: LoginFormContent, onSubmit, messageManager });
 * 
 * <FormCard
 *   title="Sign In"
 *   formRef={loginForm.ref}
 *   submitLabel="Login"
 *   sx={{ maxWidth: 400 }}
 * >
 *   <loginForm.Component />
 * </FormCard>
 * ```
 */

import { Box, Button, Card, CardContent, CardHeader } from "@mui/material";
import type React from "react";
import type { FormHandle } from "../list-manager";

export interface FormCardProps {
  /** Title to show in the card header */
  title?: string;
  /** Reference to the form (needs setVisible and submit methods) */
  formRef: React.RefObject<FormHandle>;
  /** Label for the submit button */
  submitLabel?: string;
  /** The form component to render */
  children: React.ReactNode;
  /** Optional sx prop for styling the card */
  sx?: Record<string, any>;
  /** Optional callback after successful submit */
  onSuccess?: () => void;
}

export const FormCard: React.FC<FormCardProps> = ({
  title,
  formRef,
  submitLabel = "Submit",
  children,
  sx,
  onSuccess,
}) => {
  const handleSubmit = async () => {
    try {
      await formRef.current?.submit();
      onSuccess?.();
    } catch {
      // Form handles error display via messageManager
    }
  };

  return (
    <Card sx={sx}>
      {title && <CardHeader title={title} />}
      <CardContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {children}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
          >
            {submitLabel}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
