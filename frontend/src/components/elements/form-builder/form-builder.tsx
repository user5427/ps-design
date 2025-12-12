import { Box, Alert } from "@mui/material";
import type React from "react";
import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { useForm } from "@tanstack/react-form";
import type { FormHandle } from "../list-manager";
import type { MessageManagerHandle } from "../message-manager";

export interface FormBuilderProps {
  /** Form content - receives form object and can use form.Field, other components */
  children: (form: any) => React.ReactNode;
  /** Callback when form is submitted successfully */
  onSubmit: (values: Record<string, unknown>, record?: Record<string, unknown>) => Promise<void>;
  /** Label for the submit button */
  submitLabel?: string;
  /** Initial form values */
  initialValues?: Record<string, unknown>;
  /** Message manager handle for showing success/error messages */
  messageManager?: React.RefObject<MessageManagerHandle>;
}


export const FormBuilder = forwardRef<FormHandle, FormBuilderProps>(
  ({ children, onSubmit, initialValues = {}, messageManager }, ref) => {
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    const form = useForm({
      defaultValues: initialValues as Record<string, unknown>,
      onSubmit: async ({ value }) => {
        try {
          setSubmissionError(null);
          await onSubmit(value, editingRecord || undefined);
          setEditingRecord(null);
          // Only reset form on successful submission
          form.reset();
          setHasAttemptedSubmit(false);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "An error occurred while submitting the form";
          setSubmissionError(errorMessage);
          setHasAttemptedSubmit(true);
          // Add error to message manager
          messageManager?.current?.error(errorMessage, 5000);
        }
      },
    });

    // Expose setVisible method for controlling from parent (ListManager)
    useImperativeHandle(ref, () => ({
      setVisible: (newVisible: boolean, record?: Record<string, unknown>) => {
        if (newVisible && record) {
          setEditingRecord(record);
          setHasAttemptedSubmit(false);
          // Update form values with record data
          Object.entries(record).forEach(([key, value]) => {
            form.setFieldValue(key as any, value);
          });
        } else if (!newVisible) {
          setEditingRecord(null);
          form.reset();
          setSubmissionError(null);
          setHasAttemptedSubmit(false);
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
          setHasAttemptedSubmit(true);
          form.handleSubmit();
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {submissionError && <Alert severity="error">{submissionError}</Alert>}
          {hasAttemptedSubmit &&
            form.state.isSubmitting === false &&
            Object.keys(form.state.fieldMeta).some(
              (fieldName) => form.state.fieldMeta[fieldName]?.errors?.length
            ) && <Alert severity="error">Form has errors. Please check all fields.</Alert>}

          {typeof children === 'function' ? children({ form, hasAttemptedSubmit }) : children}
        </Box>
      </form>
    );
  }
);

/**
 * Factory function to create a FormBuilder with an exposed handle and component.
 * Returns an object with:
 * - ref: A ref to control the form (setVisible, submit)
 * - Component: The actual FormBuilder component to render
 * 
 * @example
 * ```tsx
 * const { ref: formHandle, Component: FormComponent } = createForm({
 *   children: MyFormContent,
 *   onSubmit: handleSubmit,
 * });
 * 
 * // Use the handle to control the form
 * formHandle.current?.setVisible(true);
 * 
 * // Render the component
 * <FormComponent />
 * ```
 */
export function createForm(props: FormBuilderProps) {
  // Initialize with empty handle that will be replaced by forwardRef
  const formRef = useRef<FormHandle>({
    setVisible: () => {},
    submit: async () => {},
  });

  const Component: React.FC = () => (
    <FormBuilder
      ref={formRef}
      {...props}
    />
  );

  return {
    ref: formRef,
    Component,
  };
}
