/**
 * Elements Components
 * 
 * Architecture:
 * - MessageManager: Manages global and form-level messages (errors, alerts, warnings, info, success)
 * - FormBuilder: Flexible form wrapper that takes actual FormElement components as children
 * - FormElements: Individual form element components (text, number, date, select, etc.)
 * - SmartPaginationList: Lists and paginates data with sorting and filtering
 * - ListManager: Manages a list with pagination and CRUD operations in an integrated way
 */

// Message Manager
export { MessageManager, useMessageManager } from "./message-manager";
export type { Message, MessageManagerContextValue, MessageSeverity } from "./message-manager";

// Form Builder and Elements
export { FormBuilder } from "./form-builder";
export {
  FormElement,
  FormText,
  FormNumber,
  FormDate,
  FormDateTime,
  FormTextarea,
  FormSelect,
  FormAutocomplete,
  FormCheckbox,
} from "./form-builder";
export type {
  FormBuilderProps,
  ValidationRule,
  FormElementProps,
  FormFieldType,
  FormSelectOption,
} from "./form-builder";
export { minLengthValidator, maxLengthValidator, emailValidator, minValueValidator, maxValueValidator, patternValidator } from "./form-builder";

// Pagination
export { SmartPaginationList } from "./pagination";
export type { SmartPaginationListProps, SmartPaginationListRef } from "./pagination";

// List Manager
export { ListManager } from "./list-manager";
export type { ListManagerProps, FormFieldDefinition } from "./list-manager";

// Auth (existing)
export * from "./auth";
