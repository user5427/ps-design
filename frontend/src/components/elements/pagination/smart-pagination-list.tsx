import { useMemo, useState } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import {
  Box,
  Typography,
  Alert,
  TextField,
  Stack,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import type { EntityMapping } from "@ps-design/utils";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

import { usePaginatedQuery } from "@/queries/pagination";
import { SmartPaginationTableRow } from "./smart-pagination-table-row";

/**
 * Props for the Smart Pagination List Component
 *
 * This component is PURELY for LISTING and PAGINATION.
 * All CRUD operations are handled by callbacks that receive complete row data.
 */
export interface SmartPaginationListProps {
  /** Entity mapping that defines fields, endpoint, and display name */
  mapping: EntityMapping;

  onEdit?: (rowData: Record<string, unknown>) => void;
  onDelete?: (rowData: Record<string, unknown>) => void;
  onView?: (rowData: Record<string, unknown>) => void;
  onQueryChange?: (query: UniversalPaginationQuery) => void;

  /** External query state for pagination (optional) */
  query?: UniversalPaginationQuery;
}

export function SmartPaginationList({
  mapping,
  onEdit,
  onDelete,
  onView,
  query: externalQuery,
  onQueryChange,
}: SmartPaginationListProps) {
  // Fetch paginated data using the smart hook
  const {
    items,
    metadata,
    isLoading,
    error,
    query: internalQuery,
    setSearch,
  } = usePaginatedQuery(mapping);

  // Use external query if provided, otherwise use internal query state
  const query = externalQuery ?? internalQuery;

  const [searchInput, setSearchInput] = useState(query.search || "");
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

  // Build table columns from mapping
  const columns = useMemo(() => {
    const baseColumns: MRT_ColumnDef<Record<string, unknown>>[] = Object.entries(
      mapping.fields
    )
      .filter(([fieldName]) => visibleColumns[fieldName] !== false)
      .map(([fieldName, config]) => ({
        accessorKey: fieldName,
        header: config.displayName,
        size: 150,
        enableSorting: true,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (config.type === "date" && value) {
            const date = new Date(String(value));
            return date.toLocaleDateString();
          }
          return String(value || "-");
        },
      }));

    return baseColumns;
  }, [mapping, visibleColumns]);

  // Add actions column
  const tableColumns = useMemo(() => {
    return [
      ...columns,
      {
        id: "actions",
        header: "Actions",
        size: 100,
        enableSorting: false,
        Cell: ({ row }: { row: { original: Record<string, unknown> } }) => (
          <SmartPaginationTableRow
            rowData={row.original}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      },
    ];
  }, [columns, onView, onEdit, onDelete]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchInput(value);
    setSearch(value);
    onQueryChange?.(query);
  };

  // Handle column visibility
  const handleColumnVisibilityChange = (columnName: string, visible: boolean) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnName]: visible,
    }));
  };

  // Setup MRT table
  const table = useMaterialReactTable({
    columns: tableColumns,
    data: items,
    enableRowSelection: false,
    enableColumnResizing: true,
    enableGlobalFilter: false,
    enableStickyHeader: true,
    layoutMode: "grid",
    state: {
      isLoading,
    },
    muiTableContainerProps: {
      sx: { maxHeight: "calc(100vh - 300px)" },
    },
  });

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          {mapping.displayName}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<MoreVertIcon />}
            onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
          >
            Columns
          </Button>
          <Menu
            anchorEl={columnMenuAnchor}
            open={Boolean(columnMenuAnchor)}
            onClose={() => setColumnMenuAnchor(null)}
          >
            {Object.entries(mapping.fields).map(([fieldName, config]) => (
              <MenuItem key={fieldName}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={visibleColumns[fieldName] !== false}
                      onChange={(e) =>
                        handleColumnVisibilityChange(fieldName, e.target.checked)
                      }
                    />
                  }
                  label={config.displayName}
                />
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {/* Search bar */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder={`Search ${mapping.displayName}...`}
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: "action.active" }} />,
          }}
          size="small"
          variant="outlined"
          sx={{ flex: 1 }}
        />
      </Stack>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message || `Failed to load ${mapping.displayName}`}
        </Alert>
      )}

      {/* Data table */}
      <MaterialReactTable table={table} />

      {/* Pagination info */}
      {metadata && (
        <Box sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body2">
            Showing {items.length} of {metadata.total}{" "}
            {mapping.displayName.toLowerCase()}
            {metadata.total > metadata.limit &&
              ` (Page ${metadata.page} of ${Math.ceil(metadata.total / metadata.limit)})`}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
