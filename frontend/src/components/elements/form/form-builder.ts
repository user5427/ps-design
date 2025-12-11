import type {
  FormFieldDefinition,
  FormErrors,
  FormValues,
  FormTouched,
} from "./types";

/**
 * Form builder and validator utilities
 * Handles form state management, validation, and value tracking
 */

export class FormBuilder {
  /**
   * Initialize form values from field definitions
   * Uses initialValues, defaultValue, or empty string as fallback
   */
  static initializeValues(
    fields: FormFieldDefinition[],
    initialValues?: Record<string, unknown>,
  ): FormValues {
    const values: FormValues = {};

    for (const field of fields) {
      // Priority: initialValues > defaultValue > type-based default
      if (initialValues && field.name in initialValues) {
        values[field.name] = initialValues[field.name];
      } else if (field.defaultValue !== undefined) {
        values[field.name] = field.defaultValue;
      } else {
        // Type-based defaults
        switch (field.type) {
          case "checkbox":
            values[field.name] = false;
            break;
          case "number":
            values[field.name] = "";
            break;
          default:
            values[field.name] = "";
        }
      }
    }

    return values;
  }

  /**
   * Initialize touched state (all false initially)
   */
  static initializeTouched(fields: FormFieldDefinition[]): FormTouched {
    const touched: FormTouched = {};
    for (const field of fields) {
      touched[field.name] = false;
    }
    return touched;
  }

  /**
   * Validate a single field
   */
  static validateField(
    field: FormFieldDefinition,
    value: unknown,
    allValues: FormValues,
  ): string | null {
    // Check required
    if (field.required) {
      const strValue = String(value ?? "").trim();
      if (!strValue) {
        return `${field.label} is required`;
      }
    }

    // Skip other validations if field is empty and not required
    const strValue = String(value ?? "").trim();
    if (!strValue && !field.required) {
      return null;
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
  }

  /**
   * Validate all fields
   */
  static validateFields(
    fields: FormFieldDefinition[],
    values: FormValues,
  ): FormErrors {
    const errors: FormErrors = {};

    for (const field of fields) {
      const error = this.validateField(field, values[field.name], values);
      if (error) {
        errors[field.name] = error;
      }
    }

    return errors;
  }

  /**
   * Validate only touched fields
   */
  static validateTouchedFields(
    fields: FormFieldDefinition[],
    values: FormValues,
    touched: FormTouched,
  ): FormErrors {
    const errors: FormErrors = {};

    for (const field of fields) {
      if (!touched[field.name]) continue;

      const error = this.validateField(field, values[field.name], values);
      if (error) {
        errors[field.name] = error;
      }
    }

    return errors;
  }

  /**
   * Get field by name
   */
  static getField(
    fields: FormFieldDefinition[],
    fieldName: string,
  ): FormFieldDefinition | undefined {
    return fields.find((f) => f.name === fieldName);
  }

  /**
   * Get all required fields
   */
  static getRequiredFields(fields: FormFieldDefinition[]): FormFieldDefinition[] {
    return fields.filter((f) => f.required);
  }

  /**
   * Get all fields of a specific type
   */
  static getFieldsByType(
    fields: FormFieldDefinition[],
    type: string,
  ): FormFieldDefinition[] {
    return fields.filter((f) => f.type === type);
  }

  /**
   * Check if form has errors
   */
  static hasErrors(errors: FormErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  /**
   * Check if any field is touched
   */
  static anyTouched(touched: FormTouched): boolean {
    return Object.values(touched).some((t) => t === true);
  }
}
