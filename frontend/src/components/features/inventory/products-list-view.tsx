import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import type { FormFieldDefinition } from "@/components/elements/form";
import { FormModal, ValidationRules } from "@/components/elements/form";
import {
  useCreateProduct,
  useBulkDeleteProducts,
  useUpdateProduct,
} from "@/queries/inventory/products";
import { SmartPaginationList } from "@/components/elements/pagination";
import { PRODUCT_MAPPING, PRODUCT_UNIT_MAPPING } from "@ps-design/constants/inventory";
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
      name: "description",
      label: "Description",
      type: "textarea",
    },
    {
      name: "productUnitId",
      label: "Unit",
      type: "text",
      required: true,
      placeholder: "Click button to select...",
    },
  ];

  const editFormFields: FormFieldDefinition[] = [
    ...formFields,
    {
      name: "isDisabled",
      label: "Disabled",
      type: "checkbox",
    },
  ];

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
        <h2>{PRODUCT_MAPPING.displayName}</h2>
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
        fields={formFields}
        initialValues={{
          productUnitId: selectedUnitLabel,
        }}
        onSubmit={handleCreateSubmit}
      />

      <FormModal
        open={formState.isOpen && formState.mode === "edit"}
        onClose={handleCloseForm}
        title={`Edit ${PRODUCT_MAPPING.displayName}`}
        fields={editFormFields}
        initialValues={{
          ...formState.data,
          productUnitId: selectedUnitLabel || (formState.data as any)?.productUnit?.name,
        }}
        onSubmit={handleEditSubmit}
      />

      {/* Unit Selection Dialog */}
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
              onEdit={handleSelectUnit}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Button to open unit selector - shown in form context */}
      {formState.isOpen && (
        <Button
          variant="outlined"
          onClick={() => setUnitSelectOpen(true)}
          sx={{ mt: 2 }}
        >
          Select Unit
        </Button>
      )}
    </Stack>
  );
};