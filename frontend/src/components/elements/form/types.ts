/**
 * Form field validation types and definitions
 */

export type FieldType =
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

/**
 * A rule for validating form field values
 */
export interface ValidationRule {
  /** Test function that returns true if value is valid */
  test: (value: unknown, allValues?: Record<string, unknown>) => boolean;
  /** Error message to display if validation fails */
  message: string;
}

/**
 * Option for select/autocomplete fields
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Definition for a single form field
 * Used by FormBuilder and form components
 */
export interface FormFieldDefinition {
  /** Unique identifier for the field */
  name: string;
  /** Label displayed to the user */
  label: string;
  /** HTML input type or custom field type */
  type: FieldType;
  /** Whether the field is required */
  required?: boolean;
  /** Placeholder text for input */
  placeholder?: string;
  /** Options for select/autocomplete fields */
  options?: SelectOption[];
  /** Array of validation rules */
  validationRules?: ValidationRule[];
  /** Default value when form initializes */
  defaultValue?: unknown;
  /** Whether the field is read-only in view mode */
  viewOnly?: boolean;
  /** Helper text displayed below the field */
  helperText?: string;
  /** Custom CSS styles */
  sx?: Record<string, unknown>;
}

/**
 * Form field value with validation state
 */
export interface FormFieldValue {
  value: unknown;
  error?: string;
  touched: boolean;
}

/**
 * State of all form fields
 */
export interface FormValues {
  [fieldName: string]: unknown;
}

/**
 * Validation errors for form fields
 */
export interface FormErrors {
  [fieldName: string]: string;
}

/**
 * Touched state for form fields
 */
export interface FormTouched {
  [fieldName: string]: boolean;
}
