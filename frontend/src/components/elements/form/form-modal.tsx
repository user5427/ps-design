import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import type React from "react";
import { useEffect, useState, useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { FormAlert } from "./form-alert";

interface FormModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Title of the modal */
  title: string;
  /** Form content as children (receives form instance) */
  children: (form: any) => React.ReactNode;
  /** Callback when form is submitted */
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  /** Label for the submit button */
  submitLabel?: string;
  /** Initial form values */
  initialValues?: Record<string, unknown>;
}

/**
 * Flexible form modal component using TanStack Form
 *
 * Provides full control over form fields, validation, and layout.
 *
 * @example
 * ```tsx
 * <FormModal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Create Product"
 *   initialValues={{ name: "", price: 0 }}
 *   onSubmit={async (values) => {
 *     await api.post("/products", values);
 *   }}
 * >
 *   {(form) => (
 *     <>
 *       <form.Field
 *         name="name"
 *         children={(field) => (
 *           <TextField
 *             label="Name"
 *             fullWidth
 *             value={field.state.value}
 *             onChange={(e) => field.handleChange(e.target.value)}
 *             onBlur={field.handleBlur}
 *             error={!!field.state.meta.errors.length}
 *             helperText={field.state.meta.errors[0]}
 *           />
 *         )}
 *       />
 *       <Box sx={{ my: 2, p: 2 }}>Custom decoration or elements</Box>
 *     </>
 *   )}
 * </FormModal>
 * ```
 */
export const FormModal: React.FC<FormModalProps> = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Save",
  initialValues = {},
}) => {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const wasOpenRef = useRef(false);

  const form = useForm({
    defaultValues: initialValues as Record<string, unknown>,
    onSubmit: async ({ value }) => {
      try {
        setSubmissionError(null);
        await onSubmit(value);
        onClose();
      } catch (error) {
        // Capture error message for display
        const errorMessage = error instanceof Error ? error.message : "An error occurred while submitting the form";
        setSubmissionError(errorMessage);
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

  // Update specific field values when initialValues change (for syncing unit selection)
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
            {submissionError && (
              <FormAlert message={submissionError} severity="error" />
            )}
            {form.state.submissionAttempts > 0 &&
              form.state.isSubmitting === false &&
              Object.keys(form.state.fieldMeta).some(
                (fieldName) => form.state.fieldMeta[fieldName]?.errors?.length
              ) && (
                <FormAlert
                  message="Form has errors. Please check all fields."
                  severity="error"
                />
              )}
            {children(form)}
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
