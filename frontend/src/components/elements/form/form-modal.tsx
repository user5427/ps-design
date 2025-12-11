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
import { useEffect } from "react";
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
  const form = useForm({
    defaultValues: initialValues as Record<string, unknown>,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
        onClose();
      } catch (error) {
        // Error is handled by the form's error state
        throw error;
      }
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

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
