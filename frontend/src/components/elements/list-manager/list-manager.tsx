import { useRef, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type React from "react";

import type { EntityMapping } from "@ps-design/utils";

import { SmartPaginationList, type SmartPaginationListRef } from "../pagination";
import type { MessageManager } from "../message-manager";

/** Form component must expose a ref with setVisible method and submit method */
export interface FormHandle {
  setVisible: (visible: boolean, record?: Record<string, unknown>) => void;
  submit: () => Promise<void>;
}

export interface ListManagerProps {
  /** Entity mapping that defines fields, endpoint, and display name */
  mapping: EntityMapping;

  /** Reference to create form component (must expose setVisible method) */
  createFormRef: React.RefObject<FormHandle>;

  /** Reference to edit form component (must expose setVisible method) */
  editFormRef: React.RefObject<FormHandle>;

  /** Reference to delete form component (must expose setVisible method) */
  deleteFormRef?: React.RefObject<FormHandle>;

  /** MessageManager instance for showing notifications */
  messageManager?: any;

  /** Callback when an operation completes successfully (for refetching list) */
  onSuccess?: () => void;

  /** Optional custom header render function */
  renderHeader?: (actions: { onOpenCreate: () => void }) => React.ReactNode;
}

/**
 * ListManager Component
 * 
 * Pure state manager for list CRUD operations.
 * Handles:
 * - Opening/closing form components (via their setVisible ref method)
 * - Pagination list display
 * - Refetching after operations
 * 
 * Forms handle all their own logic (API calls, validation, submission).
 * ListManager just manages visibility and passes messageManager reference.
 * 
 * @example
 * ```tsx
 * const messageManager = createMessageManager();
 * const createForm = createForm({ children, onSubmit, messageManager });
 * const editForm = createForm({ children, onSubmit, messageManager });
 * 
 * return (
 *   <>
 *     <ListManager
 *       mapping={productMapping}
 *       createFormRef={createForm.ref}
 *       editFormRef={editForm.ref}
 *       messageManager={messageManager}
 *     />
 *     <createForm.Component />
 *     <editForm.Component />
 *   </>
 * );
 * ```
 */
export const ListManager: React.FC<ListManagerProps> = ({
  mapping,
  createFormRef,
  editFormRef,
  deleteFormRef,
  messageManager,
  renderHeader,
}) => {
  const paginationListRef = useRef<SmartPaginationListRef>(null);

  const openCreateForm = useCallback(() => {
    createFormRef.current?.setVisible(true);
  }, [createFormRef]);

  const openEditForm = useCallback(
    (record: Record<string, unknown>) => {
      editFormRef.current?.setVisible(true, record);
    },
    [editFormRef]
  );

  const openDeleteForm = useCallback(
    (record: Record<string, unknown>) => {
      deleteFormRef?.current?.setVisible(true, record);
    },
    [deleteFormRef]
  );

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      {/* Header - with optional custom render */}
      {renderHeader ? (
        renderHeader({ onOpenCreate: openCreateForm })
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
            onClick={openCreateForm}
          >
            New
          </Button>
        </Box>
      )}

      {/* Pagination List */}
      <SmartPaginationList
        ref={paginationListRef}
        mapping={mapping}
        onEdit={openEditForm}
        onDelete={openDeleteForm}
        messageManager={messageManager}
      />
    </Box>
  );
};
