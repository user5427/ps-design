import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import type React from "react";
import { SmartPaginationList } from "@/components/elements/pagination/smart-pagination-list";
import type { EntityMapping } from "@ps-design/utils";

interface PaginationFieldModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (rowData: Record<string, unknown>) => void;
  mapping: EntityMapping;
  title?: string;
}

export const PaginationFieldModal: React.FC<PaginationFieldModalProps> = ({
  open,
  onClose,
  onSelect,
  mapping,
  title = "Select",
}) => {
  const handleSelect = (rowData: Record<string, unknown>) => {
    onSelect(rowData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <SmartPaginationList mapping={mapping} onSelect={handleSelect} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
