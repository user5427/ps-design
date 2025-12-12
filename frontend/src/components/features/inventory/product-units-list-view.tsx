import { useState, useRef } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import { FormModal, DeleteConfirmationModal } from "@/components/elements/form";
import {
  useCreateProductUnit,
  useBulkDeleteProductUnits,
  useUpdateProductUnit,
} from "@/queries/inventory/product-unit";
import { SmartPaginationList, type SmartPaginationListRef } from "@/components/elements/pagination";
import { PRODUCT_UNIT_MAPPING, PRODUCT_UNIT_CONSTRAINTS } from "@ps-design/constants/inventory/product-unit";
import type { ProductUnitResponse } from "@ps-design/schemas/inventory/product-unit";

export const ProductUnitsListView = () => {
  const listRef = useRef<SmartPaginationListRef>(null);
  const createMutation = useCreateProductUnit();
  const updateMutation = useUpdateProductUnit();
  const bulkDeleteMutation = useBulkDeleteProductUnits();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "delete";
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
    // Refetch the list after creating
    await listRef.current?.refetch();
  };

  const handleEditSubmit = async (values: Record<string, unknown>) => {
    await updateMutation.mutateAsync({
      id: formState.data?.id || "",
      name: String(values.name),
      symbol: values.symbol ? String(values.symbol) : undefined,
    });
    setFormState({ isOpen: false, mode: "create" });
    // Refetch the list after updating
    await listRef.current?.refetch();
  };

  const handleEdit = (rowData: Record<string, unknown>) => {
    setFormState({
      isOpen: true,
      mode: "edit",
      data: rowData as ProductUnitResponse,
    });
  };

  const handleDelete = (rowData: Record<string, unknown>) => {
    setFormState({
      isOpen: true,
      mode: "delete",
      data: rowData as ProductUnitResponse,
    });
  };

  const handleDeleteSubmit = async () => {
    if (formState.data) {
      await bulkDeleteMutation.mutateAsync([formState.data.id]);
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
          Create {PRODUCT_UNIT_MAPPING.displayName}
        </Button>
      </Box>

      <SmartPaginationList
        ref={listRef}
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
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (!value || String(value).trim().length === 0) {
                    return "Name is required";
                  }
                  if (String(value).length > PRODUCT_UNIT_CONSTRAINTS.NAME.MAX_LENGTH) {
                    return PRODUCT_UNIT_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE;
                  }
                  return undefined;
                },
              }}
              >
              {(field: any) => (
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
            </form.Field>
            <form.Field
              name="symbol"
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (value && String(value).trim().length > 0) {
                    if (String(value).length > PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MAX_LENGTH) {
                      return PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MAX_LENGTH_MESSAGE;
                    }
                  }
                  return undefined;
                },
              }}
              >
              {(field: any) => (
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
            </form.Field>
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
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (!value || String(value).trim().length === 0) {
                    return "Name is required";
                  }
                  if (String(value).length > PRODUCT_UNIT_CONSTRAINTS.NAME.MAX_LENGTH) {
                    return PRODUCT_UNIT_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE;
                  }
                  return undefined;
                },
              }}
              >
              {(field: any) => (
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
            </form.Field>
            <form.Field
              name="symbol"
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (value && String(value).trim().length > 0) {
                    if (String(value).length > PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MAX_LENGTH) {
                      return PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MAX_LENGTH_MESSAGE;
                    }
                  }
                  return undefined;
                },
              }}
              >
              {(field: any) => (
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
            </form.Field>
          </>
        )}
      </FormModal>

      <DeleteConfirmationModal
        open={formState.isOpen && formState.mode === "delete"}
        onClose={() => setFormState({ isOpen: false, mode: "create" })}
        itemName={PRODUCT_UNIT_MAPPING.displayName}
        onConfirm={handleDeleteSubmit}
      />
    </Stack>
  );
};