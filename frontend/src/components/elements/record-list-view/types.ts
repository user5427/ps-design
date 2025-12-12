import type { MRT_ColumnDef } from "material-react-table";
import type React from "react";
import type { EntityMapping } from "@ps-design/utils";

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
  | "checkbox"
  | "pagination";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ValidationRule {
  test: (value: unknown, allValues?: Record<string, unknown>) => boolean;
  message: string;
}

export interface FormFieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[]; // For select/autocomplete fields
  paginationMapping?: EntityMapping; // For pagination fields
  validationRules?: ValidationRule[];
  defaultValue?: unknown;
  /** Whether field is read-only in view mode */
  viewOnly?: boolean;
}

export interface ViewFieldDefinition {
  name: string;
  label: string;
  /** Custom render function for the value */
  render?: (value: unknown, record: Record<string, unknown>) => React.ReactNode;
}

/**
 * Props passed to custom form modal render functions
 */
export interface CustomFormModalProps<T> {
  open: boolean;
  onClose: () => void;
  /** The record being edited (null for create mode) */
  initialData: T | null;
  /** Callback when form is successfully submitted */
  onSuccess: () => void;
}

export interface RecordListViewProps<T extends Record<string, unknown>> {
  /** @deprecated Use `mapping` instead. Page title displayed in the header */
  title?: string;
  /** @deprecated Use `mapping` instead. MRT column definitions */
  columns?: MRT_ColumnDef<T>[];
  /** @deprecated Use `mapping` instead. Array of records to display */
  data?: T[];
  /** @deprecated Use `mapping` instead. Loading state for the data */
  isLoading?: boolean;
  /** @deprecated Use `mapping` instead. Error state for the data */
  error?: Error | null;
  /** Form field definitions for create modal */
  createFormFields?: FormFieldDefinition[];
  /** Form field definitions for edit modal  */
  editFormFields?: FormFieldDefinition[];
  /** Callback for creating a new record  */
  onCreate?: (values: Partial<T>) => Promise<void>;
  /** Callback for editing a record  */
  onEdit?: (id: string, values: Partial<T>) => Promise<void>;
  /** Callback for deleting record(s)  */
  onDelete?: (ids: string[]) => Promise<void>;
  /** @deprecated Automatically determined from response data */
  idKey?: keyof T;
  /** Callback after successful create/edit/delete for refetching */
  onSuccess?: () => void;
  /** Field definitions for view modal (if not provided, uses editFormFields) */
  viewFields?: ViewFieldDefinition[];
  /** @deprecated No longer used, view is always shown */
  hasViewAction?: boolean;
  /** @deprecated Automatically determined from response data */
  getRowId?: (row: T) => string;
  /** Optional title for create modal (defaults to 'Create') */
  createModalTitle?: string;
  /** Optional title for edit modal (defaults to 'Edit') */
  editModalTitle?: string;
  /** Optional title for view modal (defaults to 'View') */
  viewModalTitle?: string;
  /** @deprecated Custom modals no longer supported */
  renderCustomCreateModal?: (props: CustomFormModalProps<T>) => React.ReactNode;
  /** @deprecated Custom modals no longer supported */
  renderCustomEditModal?: (props: CustomFormModalProps<T>) => React.ReactNode;
}
