import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
} from "@mui/material";
import type React from "react";
import { useEffect, useState, useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { useMessageManager } from "../message-manager";

export interface FormBuilderProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Title of the modal */
  title: string;
  /** Form content - build it however you want */
  children: React.ReactNode;
  /** Callback when form is submitted */
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  /** Label for the submit button */
  submitLabel?: string;
  /** Initial form values */
  initialValues?: Record<string, unknown>;
  /** Custom message manager (optional) */
  messageManager?: ReturnType<typeof useMessageManager>;
}

/**
 * FormBuilder Component
 * 
 * Simple form modal wrapper that consolidates fields and handles submission.
 * Takes any form content as children - you build the form however you want.
 * 
 * Features:
 * - Modal dialog management
 * - TanStack Form integration
 * - Submission handling
 * - Error display
 * - Loading state
 * - MessageManager integration
 * 
 * @example
 * ```tsx
 * const formContent = (form) => (
 *   <form.Field name="email">
 *     {(field) => <FormText label="Email" ... />}
 *   </form.Field>
 * );
 * 
 * <FormBuilder
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Create Product"
 *   onSubmit={async (values) => {
 *     await api.post("/products", values);
 *   }}
 * >
 *   {formContent}
 * </FormBuilder>
 * ```
 */
export const FormBuilder: React.FC<FormBuilderProps> = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Save",
  initialValues = {},
  messageManager,
}) => {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const wasOpenRef = useRef(false);

  const form = useForm({
    defaultValues: initialValues as Record<string, unknown>,
    onSubmit: async ({ value }) => {
      try {
        setSubmissionError(null);
        await onSubmit(value);
        if (messageManager) {
          messageManager.addMessage("Form submitted successfully", "success", 3000);
        }
        onClose();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred while submitting the form";
        setSubmissionError(errorMessage);
        if (messageManager) {
          messageManager.addMessage(errorMessage, "error");
        }
      }
    },
  });

  // Reset form only when modal transitions from closed to open
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      form.reset();
      setSubmissionError(null);
      wasOpenRef.current = true;
    } else if (!open) {
      wasOpenRef.current = false;
    }
  }, [open, form]);

  // Update specific field values when initialValues change
  useEffect(() => {
    if (open && initialValues) {
      Object.entries(initialValues).forEach(([key, value]) => {
        const currentValue = form.getFieldValue(key);
        if (currentValue !== value) {
          form.setFieldValue(key as any, value);
        }
      });
    }
  }, [initialValues, form, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableRestoreFocus>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {submissionError && <Alert severity="error">{submissionError}</Alert>}
            {form.state.submissionAttempts > 0 &&
              form.state.isSubmitting === false &&
              Object.keys(form.state.fieldMeta).some(
                (fieldName) => form.state.fieldMeta[fieldName]?.errors?.length
              ) && <Alert severity="error">Form has errors. Please check all fields.</Alert>}

            {typeof children === "function" ? (children as Function)(form) : children}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={form.state.isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={form.state.isSubmitting}
            startIcon={form.state.isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
