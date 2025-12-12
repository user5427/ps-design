import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { SmartPaginationList } from "@/components/elements/pagination";
import type { EntityMapping } from "@ps-design/utils";

interface PaginationSelectFieldProps {
  label: string;
  value: string; // The ID of the selected item
  displayValue: string; // The display text for the selected item
  onChange: (id: string, displayValue: string) => void;
  mapping: EntityMapping;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * A form field component that allows selecting an item from a paginated list
 * Shows the selected item's display value and opens a pagination list in a dialog
 */
export const PaginationSelectField: React.FC<PaginationSelectFieldProps> = ({
  label,
  value,
  displayValue,
  onChange,
  mapping,
  required = false,
  error,
  disabled = false,
  placeholder,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelect = (rowData: Record<string, unknown>) => {
    const id = String(rowData.id || "");
    // Build display value from the first non-id field
    const firstField = Object.keys(mapping.fields).find((key) => key !== "id");
    const display = firstField ? String(rowData[firstField] || id) : id;

    onChange(id, display);
    setDialogOpen(false);
  };

  const handleClear = () => {
    onChange("", "");
  };

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mb: 0.5,
          color: error ? "error.main" : "text.secondary",
        }}
      >
        {label} {required && "*"}
      </Typography>

      <TextField
        fullWidth
        value={displayValue}
        placeholder={placeholder || `Select ${mapping.displayName}`}
        disabled={disabled}
        error={!!error}
        helperText={error}
        onClick={() => !disabled && setDialogOpen(true)}
        InputProps={{
          readOnly: true,
          endAdornment:
            value && !disabled ? (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null,
        }}
        sx={{ cursor: disabled ? "default" : "pointer" }}
      />

      <Button
        variant="outlined"
        size="small"
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
        sx={{ mt: 1 }}
      >
        Browse {mapping.displayName}
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Select {mapping.displayName}</DialogTitle>
        <DialogContent>
          <Box sx={{ minHeight: 400, pt: 2 }}>
            <SmartPaginationList mapping={mapping} onSelect={handleSelect} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
