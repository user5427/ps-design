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
  validationRules?: ValidationRule[];
  defaultValue?: unknown;
  /** Whether field is read-only in view mode */
  viewOnly?: boolean;
  /** Transform value when loading into edit form (e.g., cents -> euros) */
  transformForEdit?: (value: unknown) => unknown;
  /** Transform value when submitting form (e.g., euros -> cents) */
  transformForSubmit?: (value: unknown) => unknown;
  /** Custom render function for the field */
  renderCustomField?: (props: {
    value: unknown;
    onChange: (value: unknown) => void;
    error?: string;
    disabled: boolean;
  }) => React.ReactNode;
  /** For pagination fields: entity mapping for the pagination source */
  paginationMapping?: EntityMapping;
  /** For pagination fields: which column to return when selecting a row (defaults to entire row) */
  paginationReturnColumn?: string;
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

/**
 * Context passed to renderRowActions for custom action buttons
 */
export interface RowActionsContext<T> {
  /** The record for this row */
  row: T;
  /** Open the view modal for this record */
  openViewModal: (record: T) => void;
  /** Open the edit modal for this record */
  openEditModal: (record: T) => void;
  /** Open the delete dialog for this record */
  openDeleteDialog: (ids: string[]) => void;
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
  createFormFields?: FormFieldDefinition[];
  /** Form field definitions for edit modal  */
  editFormFields?: FormFieldDefinition[];
  /** Callback for creating a new record  */
  onCreate?: (values: Partial<T>) => Promise<void>;
  /** Callback for editing a record  */
  onEdit?: (id: string, values: Partial<T>) => Promise<void>;
  /** Callback for deleting record(s)  */
  onDelete?: (ids: string[]) => Promise<void>;
  /** Unique identifier key for records (default: 'id') */
  idKey?: keyof T;
  /** Callback after successful create/edit/delete for refetching */
  onSuccess?: () => void;
  /** Field definitions for view modal (if not provided, uses editFormFields) */
  viewFields?: ViewFieldDefinition[];
  /** Whether to show view action (default: true) */
  hasViewAction?: boolean;
  /** Whether to show edit action (default: true when onEdit is provided) */
  hasEditAction?: boolean;
  /** Whether to show delete action (default: true when onDelete is provided) */
  hasDeleteAction?: boolean;
  /** Custom function to get row ID */
  getRowId?: (row: T) => string;
  /** Optional title for create modal (defaults to 'Create') */
  createModalTitle?: string;
  /** Optional title for edit modal (defaults to 'Edit') */
  editModalTitle?: string;
  /** Optional title for view modal (defaults to 'View') */
  viewModalTitle?: string;
  /**
   * When provided, this replaces the default RecordFormModal for creating records.
   * Use this for complex forms that need nested structures, dynamic fields, etc.
   */
  renderCustomCreateModal?: (props: CustomFormModalProps<T>) => React.ReactNode;
  /**
   * When provided, this replaces the default RecordFormModal for editing records.
   * Use this for complex forms that need nested structures, dynamic fields, etc.
   */
  renderCustomEditModal?: (props: CustomFormModalProps<T>) => React.ReactNode;
  /**
   * Render additional custom action buttons for each row.
   * These will be appended after the default view/edit/delete actions.
   * Use the context to access modal controls and the row data.
   */
  renderRowActions?: (context: RowActionsContext<T>) => React.ReactNode;
  /**
   * Whether to enable multi-row selection for bulk delete (default: true when onDelete is provided)
   */
  enableMultiRowSelection?: boolean;
  /**
   * Optional function to determine if a row can be edited.
   * If returns false, the edit button will be hidden for that row.
   */
  canEditRow?: (row: T) => boolean;
  /**
   * Optional function to determine if a row can be deleted.
   * If returns false, the delete checkbox and actions will be hidden for that row.
   */
  enableRowDeletion?: (row: { original: T }) => boolean;
  /**
   * Optional pagination mapping to use SmartPaginationList instead of MaterialReactTable
   * When provided, the component will render paginated data from the API endpoint
   */
  paginationMapping?: EntityMapping;
}
