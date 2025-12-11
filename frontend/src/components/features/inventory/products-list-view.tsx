import { useState, useRef } from "react";
import {
  Box,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
} from "@mui/material";
import { FormModal, DeleteConfirmationModal } from "@/components/elements/form";
import {
  useCreateProduct,
  useBulkDeleteProducts,
  useUpdateProduct,
} from "@/queries/inventory/products";
import { SmartPaginationList, type SmartPaginationListRef } from "@/components/elements/pagination";
import { PRODUCT_MAPPING, PRODUCT_CONSTRAINTS } from "@ps-design/constants/inventory/product";
import { PRODUCT_UNIT_MAPPING } from "@ps-design/constants/inventory/product-unit";
import type { ProductResponse } from "@ps-design/schemas/inventory/product";

export const ProductsListView = () => {
  const listRef = useRef<SmartPaginationListRef>(null);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const bulkDeleteMutation = useBulkDeleteProducts();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "delete";
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
    // Refetch the list after creating
    await listRef.current?.refetch();
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
    // Refetch the list after updating
    await listRef.current?.refetch();
  };

  const handleEdit = (rowData: Record<string, unknown>) => {
    setFormState({
      isOpen: true,
      mode: "edit",
      data: rowData as ProductResponse,
    });
  };

  const handleDelete = (rowData: Record<string, unknown>) => {
    setFormState({
      isOpen: true,
      mode: "delete",
      data: rowData as ProductResponse,
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

  const handleSelectUnit = (rowData: Record<string, unknown>) => {
    const unitData = rowData as any;
    const newUnitLabel = unitData.name + (unitData.symbol ? ` (${unitData.symbol})` : "");
    setSelectedUnitId(unitData.id);
    setSelectedUnitLabel(newUnitLabel);
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
        ref={listRef}
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
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (!value || String(value).trim().length === 0) {
                    return "Name is required";
                  }
                  if (String(value).length > PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH) {
                    return PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE;
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
            <form.Field
              name="description"
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (value && String(value).length > PRODUCT_CONSTRAINTS.DESCRIPTION.MAX_LENGTH) {
                    return PRODUCT_CONSTRAINTS.DESCRIPTION.MAX_LENGTH_MESSAGE;
                  }
                  return undefined;
                },
              }}
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
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (!value || String(value).trim().length === 0) {
                    return "Unit is required";
                  }
                  return undefined;
                },
              }}
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
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (!value || String(value).trim().length === 0) {
                    return "Name is required";
                  }
                  if (String(value).length > PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH) {
                    return PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE;
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
            <form.Field
              name="description"
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (value && String(value).length > PRODUCT_CONSTRAINTS.DESCRIPTION.MAX_LENGTH) {
                    return PRODUCT_CONSTRAINTS.DESCRIPTION.MAX_LENGTH_MESSAGE;
                  }
                  return undefined;
                },
              }}
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
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (!value || String(value).trim().length === 0) {
                    return "Unit is required";
                  }
                  return undefined;
                },
              }}
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

      <DeleteConfirmationModal
        open={formState.isOpen && formState.mode === "delete"}
        onClose={() => setFormState({ isOpen: false, mode: "create" })}
        itemName={PRODUCT_MAPPING.displayName}
        onConfirm={handleDeleteSubmit}
      />
    </Stack>
  );
};
