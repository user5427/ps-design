import type { MRT_ColumnDef } from "material-react-table";

export type FieldType =
  | "text"
  | "number"
  | "email"
  | "password"
  | "select"
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
  options?: SelectOption[]; // For select fields
  validationRules?: ValidationRule[];
  defaultValue?: unknown;
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
  /** Form field definitions for create modal */
  createFormFields: FormFieldDefinition[];
  /** Form field definitions for edit modal */
  editFormFields: FormFieldDefinition[];
  /** Callback for creating a new record */
  onCreate: (values: Partial<T>) => Promise<void>;
  /** Callback for editing a record */
  onEdit: (id: string, values: Partial<T>) => Promise<void>;
  /** Callback for deleting record(s) */
  onDelete: (ids: string[]) => Promise<void>;
  /** Toggle actions column and row selection (default: true) */
  hasActions?: boolean;
  /** Unique identifier key for records (default: 'id') */
  idKey?: keyof T;
  /** Callback after successful create/edit/delete for refetching */
  onSuccess?: () => void;
}
