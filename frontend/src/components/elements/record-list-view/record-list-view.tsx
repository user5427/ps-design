import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_RowSelectionState,
} from "material-react-table";
import { useMemo, useState, useCallback } from "react";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { RecordFormModal } from "./record-form-modal";
import { ViewRecordModal } from "./view-record-modal";
import type { RecordListViewProps, ViewFieldDefinition } from "./types";

export function RecordListView<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  isLoading = false,
  error,
  createFormFields = [],
  editFormFields = [],
  onCreate,
  onEdit,
  onDelete,
  idKey = "id" as keyof T,
  onSuccess,
  viewFields,
  hasViewAction = true,
  hasEditAction,
  hasDeleteAction,
  getRowId,
  renderCustomCreateModal,
  renderCustomEditModal,
  createModalTitle,
  editModalTitle,
  viewModalTitle,
  renderRowActions,
  enableMultiRowSelection,
  canEditRow,
  enableRowDeletion,
}: RecordListViewProps<T>) {
  // Compute whether to show actions - defaults to true when handler is provided
  const showEditAction = hasEditAction ?? !!onEdit;
  const showDeleteAction = hasDeleteAction ?? !!onDelete;
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [viewingRecord, setViewingRecord] = useState<T | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // Compute selected row IDs
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection).filter((key) => rowSelection[key]);
  }, [rowSelection]);

  // Action handlers
  const handleCreate = async (values: Record<string, unknown>) => {
    if (!onCreate) return;

    // Apply transformForSubmit to field values
    const transformedValues = { ...values };
    for (const field of createFormFields) {
      if (
        field.transformForSubmit &&
        transformedValues[field.name] !== undefined
      ) {
        transformedValues[field.name] = field.transformForSubmit(
          transformedValues[field.name],
        );
      }
    }

    await onCreate(transformedValues as Partial<T>);
    setSnackbar({
      open: true,
      message: "Record created successfully",
      severity: "success",
    });
    onSuccess?.();
  };

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editingRecord || !onEdit) return;
    const id = getRowId
      ? getRowId(editingRecord)
      : String(editingRecord[idKey]);

    // Apply transformForSubmit to field values
    const transformedValues = { ...values };
    for (const field of editFormFields) {
      if (
        field.transformForSubmit &&
        transformedValues[field.name] !== undefined
      ) {
        transformedValues[field.name] = field.transformForSubmit(
          transformedValues[field.name],
        );
      }
    }

    await onEdit(id, transformedValues as Partial<T>);
    setSnackbar({
      open: true,
      message: "Record updated successfully",
      severity: "success",
    });
    setEditingRecord(null);
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
    setRowSelection({});
    setDeletingIds([]);
    onSuccess?.();
  };

  const openEditModal = useCallback((record: T) => {
    setEditingRecord(record);
    setEditModalOpen(true);
  }, []);

  const openViewModal = useCallback((record: T) => {
    setViewingRecord(record);
    setViewModalOpen(true);
  }, []);

  // Transform editing record values for display in edit form
  const transformedEditingRecord = useMemo(() => {
    if (!editingRecord) return undefined;
    const transformed = { ...editingRecord } as Record<string, unknown>;
    for (const field of editFormFields) {
      if (field.transformForEdit && transformed[field.name] !== undefined) {
        transformed[field.name] = field.transformForEdit(
          transformed[field.name],
        );
      }
    }
    return transformed;
  }, [editingRecord, editFormFields]);

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

  const openDeleteDialog = useCallback((ids: string[]) => {
    setDeletingIds(ids);
    setDeleteDialogOpen(true);
  }, []);

  const tableColumns = useMemo(() => {
    return [
      ...columns,
      {
        id: "actions",
        header: "Actions",
        size: renderRowActions ? 180 : 100,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }: { row: { original: T } }) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {hasViewAction && (
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={() => openViewModal(row.original)}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {showEditAction && (!canEditRow || canEditRow(row.original)) && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => openEditModal(row.original)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {showDeleteAction &&
              (!enableRowDeletion || enableRowDeletion(row)) && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() =>
                      openDeleteDialog([String(row.original[idKey])])
                    }
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            {renderRowActions?.({
              row: row.original,
              openViewModal,
              openEditModal,
              openDeleteDialog,
            })}
          </Box>
        ),
      },
    ];
  }, [
    columns,
    hasViewAction,
    showEditAction,
    showDeleteAction,
    idKey,
    openEditModal,
    openViewModal,
    openDeleteDialog,
    renderRowActions,
    canEditRow,
    enableRowDeletion,
  ]);

  const table = useMaterialReactTable({
    columns: tableColumns,
    data,
    enableRowSelection: enableRowDeletion
      ? enableRowDeletion
      : (enableMultiRowSelection ?? !!onDelete),
    enableColumnResizing: true,
    enableGlobalFilter: true,
    enableStickyHeader: true,
    layoutMode: "grid",
    state: {
      isLoading,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => (getRowId ? getRowId(row) : String(row[idKey])),
    muiTableContainerProps: {
      sx: { maxHeight: "calc(100vh - 300px)" },
    },
  });

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
          {title}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {onDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => openDeleteDialog(selectedIds)}
              disabled={selectedIds.length === 0}
            >
              Delete{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
            </Button>
          )}

          {onCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
            >
              New
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <MaterialReactTable table={table} />

      {renderCustomCreateModal ? (
        renderCustomCreateModal({
          open: createModalOpen,
          onClose: () => setCreateModalOpen(false),
          initialData: null,
          onSuccess: () => {
            setCreateModalOpen(false);
            setSnackbar({
              open: true,
              message: "Record created successfully",
              severity: "success",
            });
            onSuccess?.();
          },
        })
      ) : (
        <RecordFormModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title={createModalTitle || `Create`}
          fields={createFormFields}
          onSubmit={handleCreate}
          submitLabel="Create"
        />
      )}

      {renderCustomEditModal ? (
        renderCustomEditModal({
          open: editModalOpen,
          onClose: () => {
            setEditModalOpen(false);
            setEditingRecord(null);
          },
          initialData: editingRecord,
          onSuccess: () => {
            setEditModalOpen(false);
            setEditingRecord(null);
            setSnackbar({
              open: true,
              message: "Record updated successfully",
              severity: "success",
            });
            onSuccess?.();
          },
        })
      ) : (
        <RecordFormModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingRecord(null);
          }}
          title={editModalTitle || `Edit`}
          fields={editFormFields}
          initialValues={transformedEditingRecord}
          onSubmit={handleEdit}
          submitLabel="Save"
        />
      )}

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
