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
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { useForm } from "@tanstack/react-form";
import { useMessageManager } from "../message-manager";
import type { FormHandle } from "../list-manager";

export interface FormBuilderProps {
  /** Form content - receives form object and can use form.Field, other components */
  children: (form: any) => React.ReactNode;
  /** Callback when form is submitted successfully */
  onSubmit: (values: Record<string, unknown>, record?: Record<string, unknown>) => Promise<void>;
  /** Title of the modal */
  title: string;
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
 * Self-contained form component that can be used with ListManager.
 * Exposes a ref with setVisible method for modal control.
 * 
 * Features:
 * - Modal dialog management
 * - TanStack Form integration (children receive form object)
 * - Submission handling
 * - Error display
 * - Loading state
 * - Ref-based visibility control
 * 
 * @example
 * ```tsx
 * const createForm = FormBuilder.create({
 *   title: "Create Product",
 *   children: (form) => (
 *     <>
 *       <form.Field name="name" defaultValue="">
 *         {(field) => <FormText label="Name" ... />}
 *       </form.Field>
 *     </>
 *   ),
 *   onSubmit: async (values) => {
 *     await api.post("/products", values);
 *   }
 * });
 * 
 * <ListManager createFormRef={createForm.ref} ... />
 * <createForm.Component />
 * ```
 */
export const FormBuilder = forwardRef<FormHandle, FormBuilderProps>(
  ({ children, onSubmit, title, submitLabel = "Save", initialValues = {}, messageManager }, ref) => {
    const [visible, setVisible] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
    const wasOpenRef = useRef(false);
    const internalMessageManager = useMessageManager();
    const msgManager = messageManager || internalMessageManager;

    const form = useForm({
      defaultValues: initialValues as Record<string, unknown>,
      onSubmit: async ({ value }) => {
        try {
          setSubmissionError(null);
          await onSubmit(value, editingRecord || undefined);
          msgManager.addMessage("Form submitted successfully", "success", 3000);
          setVisible(false);
          setEditingRecord(null);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "An error occurred while submitting the form";
          setSubmissionError(errorMessage);
          msgManager.addMessage(errorMessage, "error");
        }
      },
    });

    // Expose setVisible method to ListManager
    useImperativeHandle(ref, () => ({
      setVisible: (newVisible: boolean, record?: Record<string, unknown>) => {
        setVisible(newVisible);
        if (newVisible && record) {
          setEditingRecord(record);
          // Update form values with record data
          Object.entries(record).forEach(([key, value]) => {
            form.setFieldValue(key as any, value);
          });
        } else if (!newVisible) {
          setEditingRecord(null);
        }
      },
    }));

    // Reset form only when modal transitions from closed to open
    useEffect(() => {
      if (visible && !wasOpenRef.current) {
        form.reset();
        setSubmissionError(null);
        wasOpenRef.current = true;
      } else if (!visible) {
        wasOpenRef.current = false;
      }
    }, [visible, form]);

    const handleClose = () => setVisible(false);

    return (
      <Dialog open={visible} onClose={handleClose} maxWidth="sm" fullWidth disableRestoreFocus>
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

              {children(form)}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={form.state.isSubmitting}>
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
  }
);

FormBuilder.displayName = "FormBuilder";

interface FormBuilderStatic {
  create: (props: FormBuilderProps) => {
    ref: React.RefObject<FormHandle>;
    Component: (componentProps?: Partial<FormBuilderProps>) => React.ReactNode;
  };
}

/**
 * Factory method to create a form component with ref
 */
(FormBuilder as unknown as FormBuilderStatic).create = function createForm(props: FormBuilderProps) {
  const ref = useRef<FormHandle>(null) as React.RefObject<FormHandle>;

  return {
    ref,
    Component: (componentProps?: Partial<FormBuilderProps>) => (
      <FormBuilder ref={ref} {...props} {...componentProps} />
    ),
  };
};

// Export a namespace with the static method for better TypeScript support
export const createForm = (props: FormBuilderProps) => {
  const ref = useRef<FormHandle>(null) as React.RefObject<FormHandle>;

  return {
    ref,
    Component: (componentProps?: Partial<FormBuilderProps>) => (
      <FormBuilder ref={ref} {...props} {...componentProps} />
    ),
  };
};
