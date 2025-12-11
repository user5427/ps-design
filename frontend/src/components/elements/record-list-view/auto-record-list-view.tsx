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
  type MRT_ColumnDef,
  type MRT_RowSelectionState,
} from "material-react-table";
import { useMemo, useState } from "react";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { RecordFormModal } from "./record-form-modal";
import { ViewRecordModal } from "./view-record-modal";
import type { EntityMapping } from "@ps-design/utils";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";
import { usePaginatedQuery } from "@/queries/pagination";

export interface AutoRecordListViewProps {
  mapping: EntityMapping;
  onCreate?: (data: Record<string, unknown>) => Promise<void>;
  onEdit?: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete?: (ids: string[]) => Promise<void>;
  idKey?: string;
  onSuccess?: () => void;
  hasViewAction?: boolean;
  query?: UniversalPaginationQuery;
  onQueryChange?: (query: UniversalPaginationQuery) => void;
}

export function AutoRecordListView({
  mapping,
  onCreate,
  onEdit,
  onDelete,
  idKey = "id",
  onSuccess,
  hasViewAction = true,
  query: externalQuery,
  onQueryChange,
}: AutoRecordListViewProps) {
  const {
    items,
    metadata,
    isLoading,
    error,
    query: internalQuery,
    setQuery,
  } = usePaginatedQuery(mapping);

  // Use external query if provided, otherwise use internal query state
  const query = externalQuery ?? internalQuery;
  
  // Update query through callback if external, otherwise use setQuery
  const updateQuery = (newQuery: UniversalPaginationQuery) => {
    if (externalQuery) {
      onQueryChange?.(newQuery);
    } else {
      setQuery(newQuery);
    }
  };

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Record<string, unknown> | null>(null);
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
    try {
      await onCreate(values);
      setSnackbar({
        open: true,
        message: `${mapping.displayName} created successfully`,
        severity: "success",
      });
      setCreateModalOpen(false);
      onSuccess?.();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to create ${mapping.displayName}`,
        severity: "error",
      });
    }
  };

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editingRecord || !onEdit) return;
    try {
      const id = String(editingRecord[idKey]);
      await onEdit(id, values);
      setSnackbar({
        open: true,
        message: `${mapping.displayName} updated successfully`,
        severity: "success",
      });
      setEditingRecord(null);
      setEditModalOpen(false);
      onSuccess?.();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to update ${mapping.displayName}`,
        severity: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete(deletingIds);
      setSnackbar({
        open: true,
        message: `${deletingIds.length > 1 ? mapping.displayName + " records" : mapping.displayName} deleted successfully`,
        severity: "success",
      });
      setRowSelection({});
      setDeletingIds([]);
      onSuccess?.();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to delete ${mapping.displayName}`,
        severity: "error",
      });
    }
  };

  // Auto-generate columns from mapping
  const tableColumns = useMemo<MRT_ColumnDef<Record<string, unknown>>[]>(() => {
    const columns: MRT_ColumnDef<Record<string, unknown>>[] = [];

    // Add field columns
    Object.entries(mapping.fields).forEach(([fieldName, fieldConfig]) => {
      columns.push({
        accessorKey: fieldName,
        header: fieldConfig.displayName,
        size: 150,
      } as MRT_ColumnDef<Record<string, unknown>>);
    });

    // Add actions column
    columns.push({
      id: "actions",
      header: "Actions",
      size: 100,
      enableSorting: false,
      enableColumnFilter: false,
      Cell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {hasViewAction && (
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => {
                  setViewingRecord(row.original);
                  setViewModalOpen(true);
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  setEditingRecord(row.original);
                  setEditModalOpen(true);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  const id = String(row.original[idKey as keyof Record<string, unknown>]);
                  setDeletingIds([id]);
                  setDeleteDialogOpen(true);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    } as MRT_ColumnDef<Record<string, unknown>>);

    return columns;
  }, [mapping, hasViewAction, onEdit, onDelete, idKey]);

  const table = useMaterialReactTable({
    columns: tableColumns,
    data: items,
    enableRowSelection: !!onDelete,
    enableColumnResizing: true,
    enableGlobalFilter: false,
    enableStickyHeader: true,
    layoutMode: "grid",
    state: {
      isLoading,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => String(row[idKey as keyof Record<string, unknown>]),
    muiTableContainerProps: {
      sx: { maxHeight: "calc(100vh - 300px)" },
    },
    manualPagination: true,
    rowCount: metadata?.total ?? 0,
    onPaginationChange: (updater) => {
      const newState = typeof updater === "function" ? updater({
        pageIndex: (query.page ?? 1) - 1,
        pageSize: query.limit ?? 20,
      }) : updater;
      updateQuery({
        ...query,
        page: newState.pageIndex + 1,
        limit: newState.pageSize,
      });
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
          {mapping.displayName}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              setDeletingIds(selectedIds);
              setDeleteDialogOpen(true);
            }}
            disabled={selectedIds.length === 0 || !onDelete}
          >
            Delete{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            disabled={!onCreate}
          >
            New
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <MaterialReactTable table={table} />

      <RecordFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={`Create ${mapping.displayName}`}
        fields={[]}
        onSubmit={handleCreate}
        submitLabel="Create"
      />

      <RecordFormModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingRecord(null);
        }}
        title={`Edit ${mapping.displayName}`}
        fields={[]}
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
        title={`View ${mapping.displayName}`}
        record={viewingRecord as Record<string, unknown> | null}
        fields={Object.entries(mapping.fields).map(([fieldName, fieldConfig]) => ({
          name: fieldName,
          label: fieldConfig.displayName,
        }))}
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
