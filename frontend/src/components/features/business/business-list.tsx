import { useState, useRef } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import { FormModal, DeleteConfirmationModal } from "@/components/elements/form";
import {
  useDeleteBusiness,
  useCreateBusiness,
  useUpdateBusiness,
} from "@/queries/business";
import { SmartPaginationList, type SmartPaginationListRef } from "@/components/elements/pagination";
import { BUSINESS_MAPPING, BUSINESS_CONSTRAINTS } from "@ps-design/constants/business";
import type { BusinessResponse } from "@ps-design/schemas/business";

export const BusinessList: React.FC = () => {
  const listRef = useRef<SmartPaginationListRef>(null);
  const createMutation = useCreateBusiness();
  const updateMutation = useUpdateBusiness();
  const deleteMutation = useDeleteBusiness();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "delete";
    data?: BusinessResponse;
  }>({
    isOpen: false,
    mode: "create",
  });

  const handleCreateSubmit = async (values: Record<string, unknown>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
    });
    setFormState({ isOpen: false, mode: "create" });
    // Refetch the list after creating
    await listRef.current?.refetch();
  };

  const handleEditSubmit = async (values: Record<string, unknown>) => {
    await updateMutation.mutateAsync({
      id: formState.data?.id || "",
      name: String(values.name),
    });
    setFormState({ isOpen: false, mode: "create" });
    // Refetch the list after updating
    await listRef.current?.refetch();
  };

  const handleEdit = (rowData: Record<string, unknown>) => {
    setFormState({
      isOpen: true,
      mode: "edit",
      data: rowData as BusinessResponse,
    });
  };

  const handleDelete = (rowData: Record<string, unknown>) => {
    setFormState({
      isOpen: true,
      mode: "delete",
      data: rowData as BusinessResponse,
    });
  };

  const handleDeleteSubmit = async () => {
    if (formState.data) {
      await deleteMutation.mutateAsync(formState.data.id);
      // Refetch the list after deleting
      await listRef.current?.refetch();
    }
    setFormState({ isOpen: false, mode: "create" });
  };

  const handleCloseForm = () => {
    setFormState({ isOpen: false, mode: "create" });
  };

  const openCreateForm = () => {
    setFormState({ isOpen: true, mode: "create", data: undefined });
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button variant="contained" onClick={openCreateForm}>
          Create {BUSINESS_MAPPING.displayName}
        </Button>
      </Box>

      <SmartPaginationList
        ref={listRef}
        mapping={BUSINESS_MAPPING}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormModal
        open={formState.isOpen && formState.mode === "create"}
        onClose={handleCloseForm}
        title="Create Business"
        initialValues={{ name: "" }}
        onSubmit={handleCreateSubmit}
      >
        {(form: any) => (
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }: { value: unknown }) => {
                if (!value || String(value).trim().length === 0) {
                  return "Name is required";
                }
                if (String(value).length > BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH) {
                  return BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE;
                }
                return undefined;
              },
            }}
            children={(field: any) => (
              <TextField
                fullWidth
                label="Name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={!!field.state.meta.errors.length}
                helperText={field.state.meta.errors[0]}
                required
              />
            )}
          />
        )}
      </FormModal>

      <FormModal
        open={formState.isOpen && formState.mode === "edit"}
        onClose={handleCloseForm}
        title="Edit Business"
        initialValues={{ name: formState.data?.name || "" }}
        onSubmit={handleEditSubmit}
      >
        {(form: any) => (
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }: { value: unknown }) => {
                if (!value || String(value).trim().length === 0) {
                  return "Name is required";
                }
                if (String(value).length > BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH) {
                  return BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE;
                }
                return undefined;
              },
            }}
            children={(field: any) => (
              <TextField
                fullWidth
                label="Name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={!!field.state.meta.errors.length}
                helperText={field.state.meta.errors[0]}
                required
              />
            )}
          />
        )}
      </FormModal>

      <DeleteConfirmationModal
        open={formState.isOpen && formState.mode === "delete"}
        onClose={() => setFormState({ isOpen: false, mode: "create" })}
        itemName={BUSINESS_MAPPING.displayName}
        onConfirm={handleDeleteSubmit}
      />
    </Stack>
  );
};
