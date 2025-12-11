import { Box, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

/**
 * Props for the Smart Pagination Table Row Actions Component
 *
 * Handles rendering action buttons for a single row
 */
export interface SmartPaginationTableRowProps {
  /** The complete row data object */
  rowData: Record<string, unknown>;

  /** Called when user clicks the view button */
  onView?: (rowData: Record<string, unknown>) => void;

  /** Called when user clicks the edit button */
  onEdit?: (rowData: Record<string, unknown>) => void;

  /** Called when user clicks the delete button */
  onDelete?: (rowData: Record<string, unknown>) => void;
}

/**
 * Renders action buttons for a pagination table row
 *
 * Displays View, Edit, and Delete buttons based on provided callbacks.
 * Each button is only shown if its corresponding callback is provided.
 *
 * @example
 * ```tsx
 * <SmartPaginationTableRow
 *   rowData={product}
 *   onView={(data) => navigate(`/products/${data.id}`)}
 *   onEdit={(data) => openEditDialog(data)}
 *   onDelete={(data) => deleteProduct(data.id)}
 * />
 * ```
 */
export function SmartPaginationTableRow({
  rowData,
  onView,
  onEdit,
  onDelete,
}: SmartPaginationTableRowProps) {
  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {onView && (
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(rowData)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(rowData)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(rowData)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
