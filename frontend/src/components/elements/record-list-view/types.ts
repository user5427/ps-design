import type { MRT_ColumnDef } from "material-react-table";
import type React from "react";

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

export interface RecordListViewProps<T extends Record<string, unknown>> {
  /** Page title displayed in the header */
  title: string;
  /** MRT column definitions */
  columns: MRT_ColumnDef<T>[];
  /** Array of records to display */
  data: T[];
  /** Loading state for the data */
  isLoading?: boolean;
  /** Error state for the data */
  error?: Error | null;
  /** Form field definitions for create modal (optional for read-only mode) */
  createFormFields?: FormFieldDefinition[];
  /** Form field definitions for edit modal (optional for read-only mode) */
  editFormFields?: FormFieldDefinition[];
  /** Callback for creating a new record (optional for read-only mode) */
  onCreate?: (values: Partial<T>) => Promise<void>;
  /** Callback for editing a record (optional for read-only mode) */
  onEdit?: (id: string, values: Partial<T>) => Promise<void>;
  /** Callback for deleting record(s) (optional for read-only mode) */
  onDelete?: (ids: string[]) => Promise<void>;
  /** Toggle actions column and row selection (default: true) */
  hasActions?: boolean;
  /** Unique identifier key for records (default: 'id') */
  idKey?: keyof T;
  /** Callback after successful create/edit/delete for refetching */
  onSuccess?: () => void;
  /** Field definitions for view modal (if not provided, uses editFormFields) */
  viewFields?: ViewFieldDefinition[];
  /** Whether to show view action (default: true) */
  hasViewAction?: boolean;
  /** Whether to show edit action (default: true) */
  hasEditAction?: boolean;
  /** Whether to show delete action (default: true) */
  hasDeleteAction?: boolean;
  /** Custom function to get row ID */
  getRowId?: (row: T) => string;
}
