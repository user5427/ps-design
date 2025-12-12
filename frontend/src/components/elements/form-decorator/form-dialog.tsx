/**
 * FormDialog Component
 * 
 * Reusable wrapper that puts any FormBuilder component in a Dialog.
 * Handles all the dialog mechanics - you just provide the form ref and title.
 * 
 * @example
 * ```tsx
 * const createForm = createForm({ children, onSubmit, messageManager });
 * 
 * <FormDialog
 *   open={createOpen}
 *   title="Create Product"
 *   formRef={createForm.ref}
 *   submitLabel="Create"
 *   onClose={() => setCreateOpen(false)}
 * >
 *   <createForm.Component />
 * </FormDialog>
 * ```
 */

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import type React from "react";
import type { FormHandle } from "../list-manager";

export interface FormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Title to show in the dialog */
  title: string;
  /** Reference to the form (needs setVisible and submit methods) */
  formRef: React.RefObject<FormHandle>;
  /** Label for the submit button */
  submitLabel?: string;
  /** Callback when close is requested */
  onClose: () => void;
  /** The form component to render */
  children: React.ReactNode;
}

export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  title,
  formRef,
  submitLabel = "Save",
  onClose,
  children,
}) => {
  const handleSubmit = async () => {
    try {
      await formRef.current?.submit();
      // Form's onSubmit will close the dialog on success
    } catch {
      // Form handles error display via messageManager
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
