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
import { useState } from "react";
import { FormAlert } from "@/components/elements/form";
import type { FormFieldDefinition } from "./types";
import { getReadableError } from "@/utils/get-readable-error";
import { PaginationSelectField } from "./pagination-select-field";

interface RecordFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormFieldDefinition[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
}

export const RecordFormModal: React.FC<RecordFormModalProps> = ({
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reset = () => {
    if (open) {
      const defaultValues: Record<string, unknown> = {};
      for (const field of fields) {
        // Use initialValues first, then defaultValue, then empty string
        const initialValue = initialValues[field.name];
        defaultValues[field.name] =
          initialValue !== undefined
            ? initialValue
            : (field.defaultValue ?? "");

        // For pagination fields, set up display value from nested object if available
        if (field.type === "pagination" && field.paginationMapping) {
          const displayValueKey = `${field.name}Display`;
          // Check if the initialValue is an object with nested data (e.g., productUnit)
          const nestedValue = initialValues[field.name];
          if (nestedValue && typeof nestedValue === "object") {
            // Extract ID and display value from nested object
            const nestedObj = nestedValue as Record<string, unknown>;
            defaultValues[field.name] = nestedObj.id || "";
            // Build display value from first field or name
            const firstField = Object.keys(field.paginationMapping.fields).find(
              (key) => key !== "id",
            );
            const displayVal = firstField
              ? String(nestedObj[firstField] || "")
              : String(nestedObj.name || nestedObj.id || "");
            defaultValues[displayValueKey] = displayVal;
          } else {
            defaultValues[displayValueKey] =
              initialValues[displayValueKey] || "";
          }
        }
      }
      setValues(defaultValues);
      setErrors({});
      setSubmitError(null);
    }
  };

  const validateField = (
    field: FormFieldDefinition,
    value: unknown,
    allValues: Record<string, unknown>,
  ): string | null => {
    const strValue = String(value ?? "");

    // Check required
    if (field.required && !strValue.trim()) {
      return `${field.label} is required`;
    }

    // Run custom validation rules
    if (field.validationRules) {
      for (const rule of field.validationRules) {
        if (!rule.test(value, allValues)) {
          return rule.message;
        }
      }
    }

    return null;
  };

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      const error = validateField(field, values[field.name], values);
      if (error) newErrors[field.name] = error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(values);
      onClose();
      reset();
    } catch (err) {
      setSubmitError(getReadableError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormFieldDefinition) => {
    const value = values[field.name] ?? "";
    const error = errors[field.name];

    switch (field.type) {
      case "autocomplete": {
        const selectedOption =
          field.options?.find((opt) => opt.value === value) || null;
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
                error={!!error}
                helperText={error}
                required={field.required}
              />
            )}
            isOptionEqualToValue={(option, val) => option.value === val.value}
          />
        );
      }

      case "select":
        return (
          <FormControl fullWidth error={!!error} key={field.name}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value as string}
              label={field.label}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isSubmitting}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && (
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
              />
            }
            label={field.label}
          />
        );

      case "pagination": {
        if (!field.paginationMapping) {
          console.error(
            `Pagination field "${field.name}" missing paginationMapping`,
          );
          return null;
        }
        // Store both the ID and display value
        // The ID is stored in field.name, display value in field.name + "Display"
        const displayValueKey = `${field.name}Display`;
        const displayVal = String(values[displayValueKey] || "");

        return (
          <PaginationSelectField
            key={field.name}
            label={field.label}
            value={String(value)}
            displayValue={displayVal}
            onChange={(id, display) => {
              handleChange(field.name, id);
              handleChange(displayValueKey, display);
            }}
            mapping={field.paginationMapping}
            required={field.required}
            error={error}
            disabled={isSubmitting}
            placeholder={field.placeholder}
          />
        );
      }

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
            error={!!error}
            helperText={error}
            disabled={isSubmitting}
            required={field.required}
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
            onChange={(e) => handleChange(field.name, Number(e.target.value))}
            placeholder={field.placeholder}
            error={!!error}
            helperText={error}
            disabled={isSubmitting}
            required={field.required}
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
            error={!!error}
            helperText={error}
            disabled={isSubmitting}
            required={field.required}
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
            error={!!error}
            helperText={error}
            disabled={isSubmitting}
            required={field.required}
          />
        );

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
            error={!!error}
            helperText={error}
            disabled={isSubmitting}
            required={field.required}
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
