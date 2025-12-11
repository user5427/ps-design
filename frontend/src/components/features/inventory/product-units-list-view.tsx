import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import { FormModal } from "@/components/elements/form";
import {
  useCreateProductUnit,
  useBulkDeleteProductUnits,
  useUpdateProductUnit,
} from "@/queries/inventory/product-unit";
import { SmartPaginationList } from "@/components/elements/pagination";
import { PRODUCT_UNIT_MAPPING } from "@ps-design/constants/inventory/product-unit";
import type { ProductUnitResponse } from "@ps-design/schemas/inventory/product-unit";

export const ProductUnitsListView = () => {
  const createMutation = useCreateProductUnit();
  const updateMutation = useUpdateProductUnit();
  const bulkDeleteMutation = useBulkDeleteProductUnits();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data?: ProductUnitResponse;
  }>({
    isOpen: false,
    mode: "create",
  });

  const handleCreateSubmit = async (values: Record<string, unknown>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
      symbol: values.symbol ? String(values.symbol) : undefined,
    });
    setFormState({ isOpen: false, mode: "create" });
  };

  const handleEditSubmit = async (values: Record<string, unknown>) => {
    await updateMutation.mutateAsync({
      id: formState.data?.id || "",
      name: String(values.name),
      symbol: values.symbol ? String(values.symbol) : undefined,
    });
    setFormState({ isOpen: false, mode: "create" });
  };

  const handleEdit = (rowData: Record<string, unknown>) => {
    setFormState({
      isOpen: true,
      mode: "edit",
      data: rowData as ProductUnitResponse,
    });
  };

  const handleDelete = async (rowData: Record<string, unknown>) => {
    await bulkDeleteMutation.mutateAsync([(rowData as ProductUnitResponse).id]);
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
          Create {PRODUCT_UNIT_MAPPING.displayName}
        </Button>
      </Box>

      <SmartPaginationList
        mapping={PRODUCT_UNIT_MAPPING}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormModal
        open={formState.isOpen && formState.mode === "create"}
        onClose={handleCloseForm}
        title={`Create ${PRODUCT_UNIT_MAPPING.displayName}`}
        initialValues={{ name: "", symbol: "" }}
        onSubmit={handleCreateSubmit}
      >
        {(form) => (
          <>
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
            <form.Field
              name="symbol"
              children={(field: any) => (
                <TextField
                  fullWidth
                  label="Symbol"
                  placeholder="e.g., kg, pcs, L"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0]}
                />
              )}
            />
          </>
        )}
      </FormModal>

      <FormModal
        open={formState.isOpen && formState.mode === "edit"}
        onClose={handleCloseForm}
        title={`Edit ${PRODUCT_UNIT_MAPPING.displayName}`}
        initialValues={formState.data || { name: "", symbol: "" }}
        onSubmit={handleEditSubmit}
      >
        {(form) => (
          <>
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
            <form.Field
              name="symbol"
              children={(field: any) => (
                <TextField
                  fullWidth
                  label="Symbol"
                  placeholder="e.g., kg, pcs, L"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0]}
                />
              )}
            />
          </>
        )}
      </FormModal>
    </Stack>
  );
};