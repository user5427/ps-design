import { Box, Alert } from "@mui/material";
import type React from "react";
import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { useForm } from "@tanstack/react-form";
import type { FormHandle } from "../list-manager";

export interface FormBuilderProps {
  /** Form content - receives form object and can use form.Field, other components */
  children: (form: any) => React.ReactNode;
  /** Callback when form is submitted successfully */
  onSubmit: (values: Record<string, unknown>, record?: Record<string, unknown>) => Promise<void>;
  /** Label for the submit button */
  submitLabel?: string;
  /** Initial form values */
  initialValues?: Record<string, unknown>;
  /** Message manager instance to show success/error messages */
  messageManager?: any;
}

/**
 * FormBuilder Component
 * 
 * Pure form component with no UI wrapper (no Dialog).
 * Use with ListManager which adds the Dialog wrapper.
 * Or wrap it yourself for login, password change, etc.
 * 
 * Features:
 * - TanStack Form integration (children receive form object)
 * - Submission handling and validation
 * - Error display
 * - Loading state
 * - MessageManager integration for notifications
 * 
 * @example
 * ```tsx
 * const createForm = createForm({
 *   children: (form) => (
 *     <>
 *       <form.Field name="name" defaultValue="">
 *         {(field) => <FormText label="Name" ... />}
 *       </form.Field>
 *     </>
 *   ),
 *   onSubmit: async (values) => {
 *     await api.post("/products", values);
 *   },
 *   messageManager: messageManager
 * });
 * 
 * // Use in ListManager (automatically wrapped in Dialog)
 * <ListManager createFormRef={createForm.ref} messageManager={messageManager} />
 * <createForm.Component />
 * 
 * // Or use standalone (you control the wrapper)
 * <Dialog>
 *   <DialogTitle>Create</DialogTitle>
 *   <DialogContent>
 *     <createForm.Component />
 *   </DialogContent>
 * </Dialog>
 * ```
 */
export const FormBuilder = forwardRef<FormHandle, FormBuilderProps>(
  ({ children, onSubmit, initialValues = {} }, ref) => {
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);

    const form = useForm({
      defaultValues: initialValues as Record<string, unknown>,
      onSubmit: async ({ value }) => {
        try {
          setSubmissionError(null);
          await onSubmit(value, editingRecord || undefined);
          // Message manager will show success in the consuming component
          setEditingRecord(null);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "An error occurred while submitting the form";
          setSubmissionError(errorMessage);
        }
      },
    });

    // Expose setVisible method for controlling from parent (ListManager)
    useImperativeHandle(ref, () => ({
      setVisible: (newVisible: boolean, record?: Record<string, unknown>) => {
        if (newVisible && record) {
          setEditingRecord(record);
          // Update form values with record data
          Object.entries(record).forEach(([key, value]) => {
            form.setFieldValue(key as any, value);
          });
        } else if (!newVisible) {
          setEditingRecord(null);
          form.reset();
          setSubmissionError(null);
        }
      },
      submit: async () => {
        await form.handleSubmit();
      },
    }));

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {submissionError && <Alert severity="error">{submissionError}</Alert>}
          {form.state.submissionAttempts > 0 &&
            form.state.isSubmitting === false &&
            Object.keys(form.state.fieldMeta).some(
              (fieldName) => form.state.fieldMeta[fieldName]?.errors?.length
            ) && <Alert severity="error">Form has errors. Please check all fields.</Alert>}

          {children(form)}
        </Box>
      </form>
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
