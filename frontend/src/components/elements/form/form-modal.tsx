import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type React from "react";
import { useState, useEffect } from "react";
import { FormAlert } from "./form-alert";
import { FormBuilder } from "./form-builder";
import type { FormFieldDefinition } from "./types";

interface FormModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Title of the modal */
  title: string;
  /** Form field definitions */
  fields: FormFieldDefinition[];
  /** Initial values to populate the form */
  initialValues?: Record<string, unknown>;
  /** Callback when form is submitted */
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  /** Label for the submit button */
  submitLabel?: string;
}

/**
 * Generic form modal component
 *
 * Handles form rendering, validation, and submission.
 * Works with any set of form fields defined via FormFieldDefinition.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * const fields: FormFieldDefinition[] = [
 *   {
 *     name: "name",
 *     label: "Product Name",
 *     type: "text",
 *     required: true,
 *     validationRules: [ValidationRules.minLength(3)],
 *   },
 *   {
 *     name: "price",
 *     label: "Price",
 *     type: "number",
 *     validationRules: [ValidationRules.positive()],
 *   },
 * ];
 *
 * <FormModal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Create Product"
 *   fields={fields}
 *   onSubmit={async (values) => {
 *     await apiClient.post('/products', values);
 *   }}
 * />
 * ```
 */
export const FormModal: React.FC<FormModalProps> = ({
  open,
  onClose,
  title,
  fields,
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
}) => {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      const initialFormValues = FormBuilder.initializeValues(fields, initialValues);
      const initialTouched = FormBuilder.initializeTouched(fields);
      setValues(initialFormValues);
      setTouched(initialTouched);
      setErrors({});
      setSubmitError(null);
    }
  }, [open, fields, initialValues]);

  /**
   * Handle field value change
   * Updates values and clears errors for that field
   */
  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field on change
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle field blur
   * Marks field as touched and validates if it has validation rules
   */
  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    // Validate only this field
    const field = FormBuilder.getField(fields, fieldName);
    if (field) {
      const error = FormBuilder.validateField(field, values[fieldName], values);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[fieldName] = error;
        } else {
          delete newErrors[fieldName];
        }
        return newErrors;
      });
    }
  };

  /**
   * Handle form submission
   * Validates all fields and calls onSubmit if valid
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation display
    const allTouched: Record<string, boolean> = {};
    for (const field of fields) {
      allTouched[field.name] = true;
    }
    setTouched(allTouched);

    // Validate all fields
    const newErrors = FormBuilder.validateFields(fields, values);
    setErrors(newErrors);

    if (FormBuilder.hasErrors(newErrors)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Render a form field based on its type
   */
  const renderField = (field: FormFieldDefinition) => {
    const value = values[field.name] ?? "";
    const error = errors[field.name];
    const hasError = !!error && touched[field.name];

    switch (field.type) {
      case "autocomplete": {
        const selectedOption =
          field.options?.find((opt) => opt.value === String(value)) || null;
        return (
          <Autocomplete
            key={field.name}
            options={field.options || []}
            getOptionLabel={(option) => option.label}
            value={selectedOption}
            onChange={(_, newValue) =>
              handleChange(field.name, newValue?.value || "")
            }
            disabled={isSubmitting}
            renderInput={(params) => (
              <TextField
                {...params}
                label={field.label}
                placeholder={field.placeholder}
                error={hasError}
                helperText={hasError ? error : field.helperText}
                required={field.required}
                onBlur={() => handleBlur(field.name)}
              />
            )}
            isOptionEqualToValue={(option, val) => option.value === val.value}
          />
        );
      }

      case "select":
        return (
          <FormControl fullWidth error={hasError} key={field.name}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={String(value)}
              label={field.label}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isSubmitting}
              onBlur={() => handleBlur(field.name)}
              required={field.required}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {hasError && (
              <Box
                component="span"
                sx={{ color: "error.main", fontSize: 12, mt: 0.5 }}
              >
                {error}
              </Box>
            )}
          </FormControl>
        );

      case "checkbox":
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                disabled={isSubmitting}
                onBlur={() => handleBlur(field.name)}
              />
            }
            label={field.label}
          />
        );

      case "textarea":
        return (
          <TextField
            key={field.name}
            fullWidth
            multiline
            rows={3}
            label={field.label}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            error={hasError}
            helperText={hasError ? error : field.helperText}
            disabled={isSubmitting}
            required={field.required}
            onBlur={() => handleBlur(field.name)}
          />
        );

      case "number":
        return (
          <TextField
            key={field.name}
            fullWidth
            type="number"
            label={field.label}
            value={value}
            onChange={(e) =>
              handleChange(field.name, e.target.value ? Number(e.target.value) : "")
            }
            placeholder={field.placeholder}
            error={hasError}
            helperText={hasError ? error : field.helperText}
            disabled={isSubmitting}
            required={field.required}
            onBlur={() => handleBlur(field.name)}
          />
        );

      case "date":
        return (
          <TextField
            key={field.name}
            fullWidth
            type="date"
            label={field.label}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            error={hasError}
            helperText={hasError ? error : field.helperText}
            disabled={isSubmitting}
            required={field.required}
            onBlur={() => handleBlur(field.name)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        );

      case "datetime":
        return (
          <TextField
            key={field.name}
            fullWidth
            type="datetime-local"
            label={field.label}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            error={hasError}
            helperText={hasError ? error : field.helperText}
            disabled={isSubmitting}
            required={field.required}
            onBlur={() => handleBlur(field.name)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        );

      case "email":
      case "password":
      default:
        return (
          <TextField
            key={field.name}
            fullWidth
            type={field.type}
            label={field.label}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            error={hasError}
            helperText={hasError ? error : field.helperText}
            disabled={isSubmitting}
            required={field.required}
            onBlur={() => handleBlur(field.name)}
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {submitError && (
              <FormAlert message={submitError} severity="error" />
            )}
            {fields.map(renderField)}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
