import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import type React from "react";
import { useState } from "react";
import { FormAlert } from "@/components/elements/form";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  message?: string;
  itemCount?: number;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message,
  itemCount = 1,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultMessage =
    itemCount > 1
      ? `Are you sure you want to delete ${itemCount} selected items? This action cannot be undone.`
      : "Are you sure you want to delete this item? This action cannot be undone.";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && <FormAlert message={error} severity="error" />}
        <DialogContentText>{message || defaultMessage}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : null}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
