import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
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
import { useMemo, useState } from "react";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { RecordFormModal } from "./record-form-modal";
import type { RecordListViewProps } from "./types";

export function RecordListView<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  isLoading = false,
  error,
  createFormFields,
  editFormFields,
  onCreate,
  onEdit,
  onDelete,
  hasActions = true,
  customActions,
  idKey = "id" as keyof T,
  onSuccess,
}: RecordListViewProps<T>) {
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Row selection state
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  // Snackbar state
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
    await onCreate(values as Partial<T>);
    setSnackbar({
      open: true,
      message: "Record created successfully",
      severity: "success",
    });
    onSuccess?.();
  };

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editingRecord) return;
    const id = String(editingRecord[idKey]);
    await onEdit(id, values as Partial<T>);
    setSnackbar({
      open: true,
      message: "Record updated successfully",
      severity: "success",
    });
    setEditingRecord(null);
    onSuccess?.();
  };

  const handleDelete = async () => {
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

  const openEditModal = (record: T) => {
    setEditingRecord(record);
    setEditModalOpen(true);
  };

  const openDeleteDialog = (ids: string[]) => {
    setDeletingIds(ids);
    setDeleteDialogOpen(true);
  };

  // Columns with actions
  const tableColumns = useMemo(() => {
    if (!hasActions) return columns;

    return [
      ...columns,
      {
        id: "actions",
        header: "Actions",
        size: 100,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }: { row: { original: T } }) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => openEditModal(row.original)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
          </Box>
        ),
      },
    ];
  }, [columns, hasActions, idKey]);

  // Table instance
  const table = useMaterialReactTable({
    columns: tableColumns,
    data,
    enableRowSelection: hasActions,
    enableColumnResizing: true,
    enableGlobalFilter: true,
    enableStickyHeader: true,
    layoutMode: "grid",
    state: {
      isLoading,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => String(row[idKey]),
    muiTableContainerProps: {
      sx: { maxHeight: "calc(100vh - 300px)" },
    },
  });

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      {/* Header */}
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
          {hasActions && (
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            New
          </Button>
        </Box>
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Table */}
      <MaterialReactTable table={table} />

      {/* Create Modal */}
      <RecordFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={`Create ${title.replace(/s$/, "")}`}
        fields={createFormFields}
        onSubmit={handleCreate}
        submitLabel="Create"
      />

      {/* Edit Modal */}
      <RecordFormModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingRecord(null);
        }}
        title={`Edit ${title.replace(/s$/, "")}`}
        fields={editFormFields}
        initialValues={editingRecord as Record<string, unknown> | undefined}
        onSubmit={handleEdit}
        submitLabel="Save"
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingIds([]);
        }}
        onConfirm={handleDelete}
        itemCount={deletingIds.length}
      />

      {/* Success/Error Snackbar */}
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
