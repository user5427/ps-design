import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type React from "react";

import type { EntityMapping } from "@ps-design/utils";

import { SmartPaginationList, type SmartPaginationListRef } from "../pagination";
import { useMessageManager, MessageManager } from "../message-manager";

export interface ListManagerRef {
  /** Reference to the pagination list for refetching */
  paginationListRef: React.RefObject<SmartPaginationListRef>;
  /** Whether create modal is open */
  createModalOpen: boolean;
  /** Whether edit modal is open */
  editModalOpen: boolean;
  /** The record being edited (if any) */
  editingRecord: Record<string, unknown> | null;
  /** Open the create modal */
  openCreateModal: () => void;
  /** Close the create modal */
  closeCreateModal: () => void;
  /** Open the edit modal with a record */
  openEditModal: (record: Record<string, unknown>) => void;
  /** Close the edit modal */
  closeEditModal: () => void;
  /** Message manager instance */
  messageManager: ReturnType<typeof useMessageManager>;
}

export interface ListManagerProps {
  /** Entity mapping that defines fields, endpoint, and display name */
  mapping: EntityMapping;

  /** Form content for create modal (pass your pre-built form here) */
  createForm?: (formState: any) => React.ReactNode;

  /** Form content for edit modal (pass your pre-built form here) */
  editForm?: (formState: any) => React.ReactNode;

  /** Callback for creating a new record */
  onCreate?: (values: Record<string, unknown>) => Promise<void>;

  /** Callback for editing a record */
  onEdit?: (id: string, values: Record<string, unknown>) => Promise<void>;

  /** Callback for deleting records */
  onDelete?: (ids: string[]) => Promise<void>;

  /** Callback when an operation completes successfully */
  onSuccess?: () => void;

  /** Title for the create modal */
  createModalTitle?: string;

  /** Title for the edit modal */
  editModalTitle?: string;

  /** Optional custom header render function */
  renderHeader?: (actions: { onOpenCreate: () => void }) => React.ReactNode;

  /** Expose internal state to parent */
  onStateChange?: (state: ListManagerRef) => void;
}

  /** Callback for deleting record(s) */
  onDelete?: (ids: string[]) => Promise<void>;

  /** Callback after successful create/edit/delete for refetching */
  onSuccess?: () => void;

  /** Optional title for create modal (defaults to 'Create') */
  createModalTitle?: string;

  /** Optional title for edit modal (defaults to 'Edit') */
  editModalTitle?: string;

  /** Render function for list header (e.g., add custom buttons) */
  renderHeader?: (handlers: {
    onOpenCreate: () => void;
  }) => React.ReactNode;
}

/**
 * ListManager Component
 * 
 * Pure state manager for list + CRUD operations.
 * Handles:
 * - Modal open/close states (create, edit)
 * - Which record is being edited
 * - Refetching pagination after operations
 * - Message notifications
 * 
 * You build the forms separately and pass them in via createForm/editForm props.
 * 
 * @example
 * ```tsx
 * // Define your forms separately
 * const createProductForm = (form) => (
 *   <form.Field name="name">
 *     {(field) => <FormText label="Name" ... />}
 *   </form.Field>
 * );
 * 
 * // Use ListManager as a state manager
 * <ListManager
 *   mapping={productMapping}
 *   createForm={createProductForm}
 *   editForm={createProductForm}
 *   onCreate={async (values) => {
 *     await api.post("/products", values);
 *   }}
 *   onEdit={async (id, values) => {
 *     await api.patch(`/products/${id}`, values);
 *   }}
 *   onDelete={async (ids) => {
 *     await api.delete("/products", { data: { ids } });
 *   }}
 * />
 * ```
 */
export const ListManager: React.FC<ListManagerProps> = ({
  mapping,
  createForm,
  editForm,
  onCreate,
  onEdit,
  onDelete,
  onSuccess,
  createModalTitle = "Create",
  editModalTitle = "Edit",
  renderHeader,
  onStateChange,
}) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const paginationListRef = useRef<SmartPaginationListRef>(null);
  const messageManager = useMessageManager();

  // Expose state to parent component (useful for parent to access modals and form data)
  const openCreateModal = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
  }, []);

  const openEditModalInternal = useCallback((record: Record<string, unknown>) => {
    setEditingRecord(record);
    setEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingRecord(null);
  }, []);

  // Notify parent of state changes if they want to manage forms themselves
  const stateRef = useMemo<ListManagerRef>(
    () => ({
      paginationListRef,
      createModalOpen,
      editModalOpen,
      editingRecord,
      openCreateModal,
      closeCreateModal,
      openEditModal: openEditModalInternal,
      closeEditModal,
      messageManager,
    }),
    [createModalOpen, editModalOpen, editingRecord, openCreateModal, closeCreateModal, openEditModalInternal, closeEditModal, messageManager]
  );

  // Call onStateChange whenever state changes
  useEffect(() => {
    onStateChange?.(stateRef);
  }, [stateRef, onStateChange]);

  // Action handlers
  const handleCreate = useCallback(
    async (values: Record<string, unknown>) => {
      if (!onCreate) return;
      try {
        await onCreate(values);
        messageManager.addMessage("Record created successfully", "success", 3000);
        closeCreateModal();
        // Refetch pagination data after successful creation
        await paginationListRef.current?.refetch();
        onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred while creating the record";
        messageManager.addMessage(errorMessage, "error");
      }
    },
    [onCreate, messageManager, onSuccess, closeCreateModal]
  );

  const handleEdit = useCallback(
    async (values: Record<string, unknown>) => {
      if (!editingRecord || !onEdit) return;
      try {
        const id = String((editingRecord as any).id);
        await onEdit(id, values);
        messageManager.addMessage("Record updated successfully", "success", 3000);
        closeEditModal();
        // Refetch pagination data after successful update
        await paginationListRef.current?.refetch();
        onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred while updating the record";
        messageManager.addMessage(errorMessage, "error");
      }
    },
    [editingRecord, onEdit, messageManager, onSuccess, closeEditModal]
  );

  const handleDelete = useCallback(
    async (ids: string[]) => {
      if (!onDelete) return;
      try {
        await onDelete(ids);
        messageManager.addMessage(
          `${ids.length > 1 ? "Records" : "Record"} deleted successfully`,
          "success",
          3000
        );
        // Refetch pagination data after successful deletion
        await paginationListRef.current?.refetch();
        onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred while deleting the record";
        messageManager.addMessage(errorMessage, "error");
      }
    },
    [onDelete, messageManager, onSuccess]
  );

  const openDeleteDialog = useCallback(
    async (record: Record<string, unknown>) => {
      const id = String((record as any).id);
      if (window.confirm("Are you sure you want to delete this record?")) {
        await handleDelete([id]);
      }
    },
    [handleDelete]
  );

  return (
    <MessageManager>
      <Box sx={{ width: "100%", height: "100%" }}>
        {/* Header - with optional custom render */}
        {renderHeader ? (
          renderHeader({ onOpenCreate: openCreateModal })
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h4" component="h1">
              {mapping.displayName}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateModal}
              disabled={!onCreate}
            >
              New
            </Button>
          </Box>
        )}

        {/* Pagination List - the only thing ListManager renders besides the list */}
        <SmartPaginationList
          ref={paginationListRef}
          mapping={mapping}
          onEdit={openEditModalInternal}
          onDelete={openDeleteDialog}
          messageManager={messageManager}
        />
      </Box>
    </MessageManager>
  );
};
