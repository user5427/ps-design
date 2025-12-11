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

  const formFields: FormFieldDefinition[] = [
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
        <h2>{PRODUCT_UNIT_MAPPING.displayName}</h2>
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
        fields={formFields}
        onSubmit={handleCreateSubmit}
      />

      <FormModal
        open={formState.isOpen && formState.mode === "edit"}
        onClose={handleCloseForm}
        title={`Edit ${PRODUCT_UNIT_MAPPING.displayName}`}
        fields={formFields}
        initialValues={formState.data}
        onSubmit={handleEditSubmit}
      />
    </Stack>
  );
};