import { useState } from "react";
import {
  Box,
  Button,
  Stack,
} from "@mui/material";
import type { FormFieldDefinition } from "@/components/elements/form";
import { FormModal, ValidationRules } from "@/components/elements/form";
import {
  useCreateProductUnit,
  useBulkDeleteProductUnits,
  useProductUnits,
  useUpdateProductUnit,
} from "@/queries/inventory/product-unit";
import type { ProductUnit } from "@/schemas/inventory/product-unit";

export const ProductUnitsListView = () => {
  const { data: units = [], refetch } = useProductUnits();
  const createMutation = useCreateProductUnit();
  const updateMutation = useUpdateProductUnit();
  const bulkDeleteMutation = useBulkDeleteProductUnits();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data?: ProductUnit;
  }>({
    isOpen: false,
    mode: "create",
  });

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      validationRules: [
        ValidationRules.minLength(1),
        ValidationRules.maxLength(100),
      ],
    },
    {
      name: "symbol",
      label: "Symbol",
      type: "text",
      placeholder: "e.g., kg, pcs, L",
      validationRules: [ValidationRules.maxLength(10)],
    },
  ];

  const editFormFields: FormFieldDefinition[] = createFormFields;

  const handleCreateSubmit = async (values: Record<string, unknown>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
      symbol: values.symbol || undefined,
    });
    setFormState({ isOpen: false, mode: "create" });
    refetch();
  };

  const handleEditSubmit = async (values: Record<string, unknown>) => {
    await updateMutation.mutateAsync({
      id: formState.data?.id || "",
      data: {
        name: values.name,
        symbol: values.symbol || undefined,
      },
    });
    setFormState({ isOpen: false, mode: "create" });
    refetch();
  };

  const handleEdit = (item: ProductUnit) => {
    setFormState({
      isOpen: true,
      mode: "edit",
      data: item,
    });
  };

  const handleDelete = async (item: ProductUnit) => {
    await bulkDeleteMutation.mutateAsync([item.id]);
    refetch();
  };

  const handleCloseForm = () => {
    setFormState({ isOpen: false, mode: "create" });
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Product Units</h2>
        <Button
          variant="contained"
          onClick={() =>
            setFormState({ isOpen: true, mode: "create", data: undefined })
          }
        >
          Create Product Unit
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {units.map((item: ProductUnit) => (
          <Box key={item.id} sx={{ p: 2, border: "1px solid #ddd" }}>
            <div>{item.name}</div>
            {item.symbol && <div>{item.symbol}</div>}
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Button size="small" onClick={() => handleEdit(item)}>
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => handleDelete(item)}
              >
                Delete
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      <FormModal
        open={formState.isOpen && formState.mode === "create"}
        onClose={handleCloseForm}
        title="Create Product Unit"
        fields={createFormFields}
        onSubmit={handleCreateSubmit}
      />

      <FormModal
        open={formState.isOpen && formState.mode === "edit"}
        onClose={handleCloseForm}
        title="Edit Product Unit"
        fields={editFormFields}
        initialValues={formState.data}
        onSubmit={handleEditSubmit}
      />
    </Stack>
  );
};