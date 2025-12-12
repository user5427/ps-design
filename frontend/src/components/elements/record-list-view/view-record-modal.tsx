import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import type React from "react";
import type { ViewFieldDefinition } from "./types";

interface ViewRecordModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  record: Record<string, unknown> | null;
  fields: ViewFieldDefinition[];
}

export const ViewRecordModal: React.FC<ViewRecordModalProps> = ({
  open,
  onClose,
  title,
  record,
  fields,
}) => {
  if (!record) return null;

  const formatValue = (field: ViewFieldDefinition): React.ReactNode => {
    const value = getNestedValue(record, field.name);

    // Use custom render if provided
    if (field.render) {
      return field.render(value, record);
    }

    // Default formatting based on value type
    if (value === null || value === undefined) {
      return <Typography color="text.secondary">-</Typography>;
    }

    if (typeof value === "boolean") {
      return (
        <Chip
          label={value ? "Yes" : "No"}
          color={value ? "success" : "default"}
          size="small"
        />
      );
    }

    if (typeof value === "object") {
      // Handle nested objects
      if ("name" in value) {
        return String((value as { name: string }).name);
      }
      return JSON.stringify(value);
    }

    // Format dates
    if (typeof value === "string" && isISODateString(value)) {
      return formatDate(value);
    }

    return String(value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {fields.map((field, index) => (
            <Box key={field.name}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                {field.label}
              </Typography>
              <Box sx={{ mt: 0.5 }}>{formatValue(field)}</Box>
              {index < fields.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper function to get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function isISODateString(str: string): boolean {
  // Match ISO date format (YYYY-MM-DD or full ISO datetime)
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(str);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (dateStr.length === 10) {
    return date.toLocaleDateString();
  }
  return date.toLocaleString();
}
