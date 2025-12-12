import type React from "react";
import { Typography } from "@mui/material";
import { FormModal } from "./form-modal";

interface DeleteConfirmationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** The name/type of item being deleted (e.g., "Product Unit", "Business") */
  itemName: string;
  /** Callback when delete is confirmed */
  onConfirm: () => Promise<void>;
}

/**
 * Reusable delete confirmation modal component
 *
 * Provides a standard delete confirmation dialog that can be used across the application.
 *
 * @example
 * ```tsx
 * <DeleteConfirmationModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   itemName="Product"
 *   onConfirm={async () => {
 *     await deleteProduct(id);
 *   }}
 * />
 * ```
 */
export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onClose,
  itemName,
  onConfirm,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Confirm Delete"
      submitLabel="Delete"
      initialValues={{}}
      onSubmit={onConfirm}
    >
      {() => (
        <Typography>
          Are you sure you want to delete this {itemName.toLowerCase()}? This action cannot be undone.
        </Typography>
      )}
    </FormModal>
  );
};
