import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
} from "@mui/material";
import { FormModal } from "@/components/elements/form";
import {
  useCreateProduct,
  useBulkDeleteProducts,
  useUpdateProduct,
} from "@/queries/inventory/products";
import { SmartPaginationList } from "@/components/elements/pagination";
import { PRODUCT_MAPPING } from "@ps-design/constants/inventory/product";
import { PRODUCT_UNIT_MAPPING } from "@ps-design/constants/inventory/product-unit";
import type { ProductResponse } from "@ps-design/schemas/inventory/product";

export const ProductsListView = () => {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const bulkDeleteMutation = useBulkDeleteProducts();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data?: ProductResponse;
  }>({
    isOpen: false,
    mode: "create",
  });

  const [unitSelectOpen, setUnitSelectOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitLabel, setSelectedUnitLabel] = useState<string>("");

  const handleCreateSubmit = async (values: Record<string, unknown>) => {
    if (!selectedUnitId) {
      alert("Please select a unit");
      return;
    }
    await createMutation.mutateAsync({
      name: String(values.name),
      description: values.description ? String(values.description) : undefined,
      productUnitId: selectedUnitId,
    });
    setFormState({ isOpen: false, mode: "create" });
    setSelectedUnitId(null);
    setSelectedUnitLabel("");
  };

  const handleEditSubmit = async (values: Record<string, unknown>) => {
    await updateMutation.mutateAsync({
      id: formState.data?.id || "",
      name: values.name ? String(values.name) : undefined,
      description: values.description ? String(values.description) : undefined,
      productUnitId: selectedUnitId || undefined,
      isDisabled: values.isDisabled as boolean | undefined,
    });
    setFormState({ isOpen: false, mode: "create" });
    setSelectedUnitId(null);
    setSelectedUnitLabel("");
  };

  const handleEdit = (rowData: Record<string, unknown>) => {
    setFormState({
      isOpen: true,
      mode: "edit",
      data: rowData as ProductResponse,
    });
  };

  const handleDelete = async (rowData: Record<string, unknown>) => {
    await bulkDeleteMutation.mutateAsync([(rowData as ProductResponse).id]);
  };

  const handleCloseForm = () => {
    setFormState({ isOpen: false, mode: "create" });
  };

  const openCreateForm = () => {
    setFormState({ isOpen: true, mode: "create", data: undefined });
  };

  const handleSelectUnit = (rowData: Record<string, unknown>) => {
    const unitData = rowData as any;
    setSelectedUnitId(unitData.id);
    setSelectedUnitLabel(unitData.name + (unitData.symbol ? ` (${unitData.symbol})` : ""));
    setUnitSelectOpen(false);
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button variant="contained" onClick={openCreateForm}>
          Create {PRODUCT_MAPPING.displayName}
        </Button>
      </Box>

      <SmartPaginationList
        mapping={PRODUCT_MAPPING}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormModal
        open={formState.isOpen && formState.mode === "create"}
        onClose={handleCloseForm}
        title={`Create ${PRODUCT_MAPPING.displayName}`}
        initialValues={{
          name: "",
          description: "",
          productUnitId: selectedUnitLabel,
        }}
        onSubmit={handleCreateSubmit}
      >
        {(form: any) => (
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
              name="description"
              children={(field: any) => (
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0]}
                />
              )}
            />
            <form.Field
              name="productUnitId"
              children={(field: any) => (
                <TextField
                  fullWidth
                  label="Unit"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Click 'Select Unit' button"
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0] || "Select a unit"}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  required
                />
              )}
            />
            <Button
              variant="outlined"
              onClick={() => setUnitSelectOpen(true)}
              fullWidth
            >
              Select Unit
            </Button>
          </>
        )}
      </FormModal>

      <FormModal
        open={formState.isOpen && formState.mode === "edit"}
        onClose={handleCloseForm}
        title={`Edit ${PRODUCT_MAPPING.displayName}`}
        initialValues={{
          name: formState.data?.name || "",
          description: formState.data?.description || "",
          productUnitId: selectedUnitLabel || (formState.data as any)?.productUnit?.name || "",
          isDisabled: formState.data?.isDisabled || false,
        }}
        onSubmit={handleEditSubmit}
      >
        {(form: any) => (
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
              name="description"
              children={(field: any) => (
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0]}
                />
              )}
            />
            <form.Field
              name="productUnitId"
              children={(field: any) => (
                <TextField
                  fullWidth
                  label="Unit"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Click 'Select Unit' button"
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0] || "Select a unit"}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  required
                />
              )}
            />
            <Button
              variant="outlined"
              onClick={() => setUnitSelectOpen(true)}
              fullWidth
            >
              Select Unit
            </Button>
          </>
        )}
      </FormModal>

      <Dialog
        open={unitSelectOpen}
        onClose={() => setUnitSelectOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Product Unit</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          <Box sx={{ mt: 2 }}>
            <SmartPaginationList
              mapping={PRODUCT_UNIT_MAPPING}
              onSelect={handleSelectUnit}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};
