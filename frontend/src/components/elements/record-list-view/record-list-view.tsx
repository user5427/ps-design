import AddIcon from "@mui/icons-material/Add";
import { Alert, Box, Button, Snackbar, Typography } from "@mui/material";
import { useMemo, useState, useCallback } from "react";
import type { EntityMapping } from "@ps-design/utils";

import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { RecordFormModal } from "./record-form-modal";
import { ViewRecordModal } from "./view-record-modal";
import { SmartPaginationList } from "@/components/elements/pagination";
import { usePaginatedQuery } from "@/queries/pagination";
import type { RecordListViewProps, ViewFieldDefinition } from "./types";

/**
 * @deprecated Use SmartPaginationList with mapping constants instead.
 * This component now wraps SmartPagination visualization with RecordListView CRUD logic.
 * Pass `mapping` instead of `columns` and `data`.
 */
export function RecordListView<T extends Record<string, unknown>>({
  mapping,
  createFormFields = [],
  editFormFields = [],
  onCreate,
  onEdit,
  onDelete,
  onSuccess,
  viewFields,
  createModalTitle,
  editModalTitle,
  viewModalTitle,
  // DEPRECATED PROPS - kept for backwards compatibility but ignored
  title: _title,
  columns: _columns,
  data: _data,
  isLoading: _isLoading,
  error: _error,
  idKey: _idKey,
  hasViewAction: _hasViewAction,
  getRowId: _getRowId,
  renderCustomCreateModal: _renderCustomCreateModal,
  renderCustomEditModal: _renderCustomEditModal,
}: RecordListViewProps<T> & { mapping: EntityMapping }) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [viewingRecord, setViewingRecord] = useState<T | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // Use pagination hook
  const {
    isLoading: _paginationLoading,
    error: paginationError,
    refetch,
  } = usePaginatedQuery(mapping);

  // Action handlers
  const handleCreate = async (values: Record<string, unknown>) => {
    if (!onCreate) return;
    await onCreate(values as Partial<T>);
    setSnackbar({
      open: true,
      message: "Record created successfully",
      severity: "success",
    });
    setCreateModalOpen(false);
    await refetch();
    onSuccess?.();
  };

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editingRecord || !onEdit) return;
    const id = String((editingRecord as Record<string, unknown>).id);
    await onEdit(id, values as Partial<T>);
    setSnackbar({
      open: true,
      message: "Record updated successfully",
      severity: "success",
    });
    setEditingRecord(null);
    setEditModalOpen(false);
    await refetch();
    onSuccess?.();
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    await onDelete(deletingIds);
    setSnackbar({
      open: true,
      message: `${deletingIds.length > 1 ? "Records" : "Record"} deleted successfully`,
      severity: "success",
    });
    setDeletingIds([]);
    setDeleteDialogOpen(false);
    await refetch();
    onSuccess?.();
  };

  const openEditModal = useCallback((record: Record<string, unknown>) => {
    setEditingRecord(record as T);
    setEditModalOpen(true);
  }, []);

  const openViewModal = useCallback((record: Record<string, unknown>) => {
    setViewingRecord(record as T);
    setViewModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((record: Record<string, unknown>) => {
    setDeletingIds([String((record as Record<string, unknown>).id)]);
    setDeleteDialogOpen(true);
  }, []);

  // Generate view fields from edit fields if not provided
  const computedViewFields: ViewFieldDefinition[] = useMemo(() => {
    if (viewFields) return viewFields;

    return editFormFields.map((field) => ({
      name: field.name,
      label: field.label,
      render:
        field.type === "select" || field.type === "autocomplete"
          ? (value: unknown) => {
              const option = field.options?.find((opt) => opt.value === value);
              return option?.label || String(value || "-");
            }
          : undefined,
    }));
  }, [viewFields, editFormFields]);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          {mapping?.displayName || _title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
          disabled={!onCreate}
        >
          New
        </Button>
      </Box>

      {paginationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {String(
            (paginationError as unknown as Record<string, unknown>)?.message ||
              "An error occurred",
          )}
        </Alert>
      )}

      <SmartPaginationList
        mapping={mapping}
        onEdit={openEditModal}
        onDelete={openDeleteDialog}
        onView={openViewModal}
      />

      <RecordFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={createModalTitle || `Create`}
        fields={createFormFields}
        onSubmit={handleCreate}
        submitLabel="Create"
      />

      <RecordFormModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingRecord(null);
        }}
        title={editModalTitle || `Edit`}
        fields={editFormFields}
        initialValues={editingRecord as Record<string, unknown> | undefined}
        onSubmit={handleEdit}
        submitLabel="Save"
      />

      <ViewRecordModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewingRecord(null);
        }}
        title={viewModalTitle || `View`}
        record={viewingRecord as Record<string, unknown> | null}
        fields={computedViewFields}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingIds([]);
        }}
        onConfirm={handleDelete}
        itemCount={deletingIds.length}
      />

      {/* Success/Error notification bottom right */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
