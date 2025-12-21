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
  InputAdornment,
  IconButton,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { DateTimeField } from "@mui/x-date-pickers/DateTimeField";
import type React from "react";
import { useRef, useState } from "react";
import dayjs from "dayjs";
import { FormAlert } from "@/components/elements/form";
import type { FormFieldDefinition } from "./types";
import { SmartPaginationList } from "@/components/elements/pagination/smart-pagination-list";
import { getReadableError } from "@/utils/get-readable-error";

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

  const prevOpenRef = useRef(false);

  // TODO: fix this :)
  const populateFormWithInitialValues = () => {
    const defaultValues: Record<string, unknown> = {};
    for (const field of fields) {
      let initialValue = initialValues[field.name];

      // If initialValue is not found and field name ends with an ID (like categoryId),
      // try to extract from nested property (e.g., category.id)
      if (
        initialValue === undefined &&
        field.name.endsWith("Id") &&
        field.type === "select"
      ) {
        const nestedKey = field.name.slice(0, -2);
        const nestedObj = initialValues[nestedKey];
        if (nestedObj && typeof nestedObj === "object" && "id" in nestedObj) {
          initialValue = (nestedObj as { id: unknown }).id;
        }
      }

      defaultValues[field.name] =
        initialValue !== undefined ? initialValue : (field.defaultValue ?? "");
    }
    setValues(defaultValues);
    setErrors({});
    setSubmitError(null);
  };

  if (open && !prevOpenRef.current) {
    populateFormWithInitialValues();
    prevOpenRef.current = true;
  }
  if (!open) {
    prevOpenRef.current = false;
  }

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
    } catch (err) {
      setSubmitError(getReadableError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormFieldDefinition) => {
    const value = values[field.name] ?? "";
    const error = errors[field.name];

    // If custom renderer is provided, use it
    if (field.renderCustomField) {
      return (
        <Box key={field.name}>
          {field.renderCustomField({
            value,
            onChange: (newValue) => handleChange(field.name, newValue),
            error,
            disabled: isSubmitting,
          })}
        </Box>
      );
    }

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
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment:
                  !field.required && value ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleChange(field.name, "")}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
              },
            }}
          />
        );

      case "datetime":
        return (
          <DateTimeField
            key={field.name}
            label={field.label}
            value={value ? dayjs(value as string) : null}
            onChange={(newValue) =>
              handleChange(field.name, newValue ? newValue.toISOString() : "")
            }
            disabled={isSubmitting}
            required={field.required}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error,
                InputProps: {
                  endAdornment:
                    !field.required && value ? (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => handleChange(field.name, "")}
                          edge="end"
                          size="small"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                },
              },
            }}
            format="YYYY-MM-DD HH:mm"
          />
        );

      case "pagination":
        if (!field.paginationMapping) {
          return (
            <Box key={field.name} sx={{ color: "error.main", fontSize: 14 }}>
              Pagination field "{field.name}" missing paginationMapping
            </Box>
          );
        }
        return (
          <Box key={field.name}>
            <Box sx={{ mb: 1, fontSize: 14, fontWeight: 500 }}>
              {field.label}
              {field.required && <span style={{ color: "red" }}> *</span>}
            </Box>
            <SmartPaginationList
              mapping={field.paginationMapping}
              onSelect={(rowData) => {
                const selectedValue = field.paginationReturnColumn
                  ? rowData[field.paginationReturnColumn]
                  : rowData;
                handleChange(field.name, selectedValue);
              }}
            />
            {error && (
              <Box sx={{ color: "error.main", fontSize: 12, mt: 0.5 }}>
                {error}
              </Box>
            )}
          </Box>
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
