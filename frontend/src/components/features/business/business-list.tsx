import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import { FormModal } from "@/components/elements/form";
import {
  useDeleteBusiness,
  useCreateBusiness,
  useUpdateBusiness,
} from "@/queries/business";
import { SmartPaginationList } from "@/components/elements/pagination";
import { BUSINESS_MAPPING } from "@ps-design/constants/business";
import type { BusinessResponse } from "@ps-design/schemas/business";

export const BusinessList: React.FC = () => {
  const createMutation = useCreateBusiness();
  const updateMutation = useUpdateBusiness();
  const deleteMutation = useDeleteBusiness();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
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
  };

  const handleEditSubmit = async (values: Record<string, unknown>) => {
    await updateMutation.mutateAsync({
      id: formState.data?.id || "",
      name: String(values.name),
    });
    setFormState({ isOpen: false, mode: "create" });
  };

  const handleEdit = (rowData: Record<string, unknown>) => {
    setFormState({
      isOpen: true,
      mode: "edit",
      data: rowData as BusinessResponse,
    });
  };

  const handleDelete = async (rowData: Record<string, unknown>) => {
    await deleteMutation.mutateAsync((rowData as BusinessResponse).id);
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
        <h2>{BUSINESS_MAPPING.displayName}</h2>
        <Button variant="contained" onClick={openCreateForm}>
          Create {BUSINESS_MAPPING.displayName}
        </Button>
      </Box>

      <SmartPaginationList
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
    </Stack>
  );
};
