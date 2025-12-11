import { Chip } from "@mui/material";
import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Stack,
} from "@mui/material";
import type { FormFieldDefinition } from "@/components/elements/form";
import { FormModal, ValidationRules } from "@/components/elements/form";
import {
  useCreateProduct,
  useBulkDeleteProducts,
  useProductUnits,
  useProducts,
  useUpdateProduct,
} from "@/hooks/inventory";
import type { Product } from "@/schemas/inventory";

export const ProductsListView = () => {
  const { data: products = [], refetch } = useProducts();
  const { data: units = [] } = useProductUnits();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const bulkDeleteMutation = useBulkDeleteProducts();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data?: Product;
  }>({
    isOpen: false,
    mode: "create",
  });

  const unitOptions = useMemo(
    () =>
      units.map((unit: any) => ({
        value: unit.id,
        label: unit.name + (unit.symbol ? ` (${unit.symbol})` : ""),
      })),
    [units],
  );

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
      name: "description",
      label: "Description",
      type: "textarea",
    },
    {
      name: "productUnitId",
      label: "Unit",
      type: "autocomplete",
      required: true,
      options: unitOptions,
      placeholder: "Search units...",
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    ...createFormFields,
    {
      name: "isDisabled",
      label: "Disabled",
      type: "checkbox",
    },
  ];

  const handleCreateSubmit = async (values: Record<string, unknown>) => {
    await createMutation.mutateAsync({
      name: String(values.name),
      description: values.description || undefined,
      productUnitId: String(values.productUnitId),
    });
    setFormState({ isOpen: false, mode: "create" });
    refetch();
  };

  const handleEditSubmit = async (values: Record<string, unknown>) => {
    await updateMutation.mutateAsync({
      id: formState.data?.id || "",
      data: {
        name: values.name,
        description: values.description || undefined,
        productUnitId: values.productUnitId,
        isDisabled: values.isDisabled,
      },
    });
    setFormState({ isOpen: false, mode: "create" });
    refetch();
  };

  const handleEdit = (item: Product) => {
    setFormState({
      isOpen: true,
      mode: "edit",
      data: item,
    });
  };

  const handleDelete = async (item: Product) => {
    await bulkDeleteMutation.mutateAsync([item.id]);
    refetch();
  };

  const handleCloseForm = () => {
    setFormState({ isOpen: false, mode: "create" });
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Products</h2>
        <Button
          variant="contained"
          onClick={() =>
            setFormState({ isOpen: true, mode: "create", data: undefined })
          }
        >
          Create Product
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {products.map((item: Product) => (
          <Box key={item.id} sx={{ p: 2, border: "1px solid #ddd" }}>
            <div>{item.name}</div>
            {item.description && <div>{item.description}</div>}
            <div>{item.productUnit.name}</div>
            <Chip
              label={item.isDisabled ? "Disabled" : "Active"}
              color={item.isDisabled ? "default" : "success"}
              size="small"
            />
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
        title="Create Product"
        fields={createFormFields}
        onSubmit={handleCreateSubmit}
      />

      <FormModal
        open={formState.isOpen && formState.mode === "edit"}
        onClose={handleCloseForm}
        title="Edit Product"
        fields={editFormFields}
        initialValues={formState.data}
        onSubmit={handleEditSubmit}
      />
    </Stack>
  );
};