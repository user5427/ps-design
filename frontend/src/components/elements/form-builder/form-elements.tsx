import {
  TextField,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Box,
} from "@mui/material";
import type React from "react";

export type FormFieldType =
  | "text"
  | "number"
  | "email"
  | "password"
  | "select"
  | "autocomplete"
  | "date"
  | "datetime"
  | "textarea"
  | "checkbox";

export interface FormSelectOption {
  value: string | number;
  label: string;
}

export interface FormElementProps {
  fieldName: string;
  label: string;
  type: FormFieldType;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
  options?: FormSelectOption[];
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  touched?: boolean;
}

/**
 * FormText Component - Text input field
 */
export const FormText: React.FC<FormElementProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required,
  placeholder,
  disabled,
  fullWidth = true,
  type,
  touched,
}) => (
  <TextField
    label={label}
    type={type === "email" || type === "password" ? type : "text"}
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    error={touched && error}
    helperText={touched && helperText}
    required={required}
    placeholder={placeholder}
    disabled={disabled}
    fullWidth={fullWidth}
  />
);

/**
 * FormNumber Component - Numeric input field
 */
export const FormNumber: React.FC<FormElementProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required,
  placeholder,
  disabled,
  fullWidth = true,
  touched,
}) => (
  <TextField
    label={label}
    type="number"
    value={value || ""}
    onChange={(e) => onChange(Number(e.target.value))}
    onBlur={onBlur}
    error={touched && error}
    helperText={touched && helperText}
    required={required}
    placeholder={placeholder}
    disabled={disabled}
    fullWidth={fullWidth}
  />
);

/**
 * FormDate Component - Date input field
 */
export const FormDate: React.FC<FormElementProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required,
  disabled,
  fullWidth = true,
  touched,
}) => (
  <TextField
    label={label}
    type="date"
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    error={touched && error}
    helperText={touched && helperText}
    required={required}
    disabled={disabled}
    fullWidth={fullWidth}
    InputLabelProps={{ shrink: true }}
  />
);

/**
 * FormDateTime Component - Date and time input field
 */
export const FormDateTime: React.FC<FormElementProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required,
  disabled,
  fullWidth = true,
  touched,
}) => (
  <TextField
    label={label}
    type="datetime-local"
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    error={touched && error}
    helperText={touched && helperText}
    required={required}
    disabled={disabled}
    fullWidth={fullWidth}
    InputLabelProps={{ shrink: true }}
  />
);

/**
 * FormTextarea Component - Multi-line text input
 */
export const FormTextarea: React.FC<FormElementProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required,
  placeholder,
  disabled,
  fullWidth = true,
  rows = 4,
  touched,
}) => (
  <TextField
    label={label}
    multiline
    rows={rows}
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    error={touched && error}
    helperText={touched && helperText}
    required={required}
    placeholder={placeholder}
    disabled={disabled}
    fullWidth={fullWidth}
  />
);

/**
 * FormSelect Component - Dropdown select field
 */
export const FormSelect: React.FC<FormElementProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required,
  disabled,
  fullWidth = true,
  options = [],
  touched,
}) => (
  <Box>
    <Select
      label={label}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      error={touched && error}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
    {touched && helperText && <Box sx={{ color: "error.main", fontSize: "0.75rem", mt: 0.5 }}>{helperText}</Box>}
  </Box>
);

/**
 * FormAutocomplete Component - Autocomplete select field
 */
export const FormAutocomplete: React.FC<FormElementProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required,
  placeholder,
  disabled,
  fullWidth = true,
  options = [],
  touched,
}) => (
  <Autocomplete
    options={options}
    getOptionLabel={(option) =>
      typeof option === "string" ? option : option.label || String(option.value)
    }
    value={options.find((o) => o.value === value) || null}
    onChange={(_, newValue) => onChange(newValue?.value || null)}
    onBlur={onBlur}
    disabled={disabled}
    fullWidth={fullWidth}
    renderInput={(params) => (
      <TextField
        {...params}
        label={label}
        placeholder={placeholder}
        error={touched && error}
        helperText={touched && helperText}
        required={required}
      />
    )}
  />
);

/**
 * FormCheckbox Component - Checkbox field
 */
export const FormCheckbox: React.FC<FormElementProps> = ({
  label,
  value,
  onChange,
  disabled,
}) => (
  <FormControlLabel
    control={
      <Checkbox
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    }
    label={label}
  />
);

/**
 * Generic form element renderer
 */
export const FormElement: React.FC<FormElementProps> = (props) => {
  switch (props.type) {
    case "email":
    case "password":
      return <FormText {...props} />;
    case "number":
      return <FormNumber {...props} />;
    case "date":
      return <FormDate {...props} />;
    case "datetime":
      return <FormDateTime {...props} />;
    case "textarea":
      return <FormTextarea {...props} />;
    case "select":
      return <FormSelect {...props} />;
    case "autocomplete":
      return <FormAutocomplete {...props} />;
    case "checkbox":
      return <FormCheckbox {...props} />;
    case "text":
    default:
      return <FormText {...props} />;
  }
};
