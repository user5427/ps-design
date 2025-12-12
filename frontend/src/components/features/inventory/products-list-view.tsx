import { useState } from "react";
import type React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
} from "@mui/material";
import {
  useCreateProduct,
  useBulkDeleteProducts,
  useUpdateProduct,
} from "@/queries/inventory/products";
import { SmartPaginationList } from "@/components/elements/pagination";
import { PRODUCT_MAPPING, PRODUCT_CONSTRAINTS } from "@ps-design/constants/inventory/product";
import { PRODUCT_UNIT_MAPPING } from "@ps-design/constants/inventory/product-unit";
import { FormText, FormTextarea } from "@/components/elements/form-builder";
import { ListManager } from "@/components/elements/list-manager";

export const ProductsListView = () => {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const bulkDeleteMutation = useBulkDeleteProducts();

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedUnitLabel, setSelectedUnitLabel] = useState<string>("");
  const [unitSelectOpen, setUnitSelectOpen] = useState(false);

  // Create form generator function
  const createProductFormSchema = (onOpenUnitSelect: () => void): ((form: any) => React.ReactNode) => (
    (form: any) => (
      <>
        <form.Field
          name="name"
          defaultValue=""
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
        >
          {(field: any) => (
            <FormText
              fieldName="name"
              label="Name"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.state.meta.errors.length > 0}
              helperText={field.state.meta.errors[0] || ""}
              type="text"
              required
            />
          )}
        </form.Field>

        <form.Field
          name="description"
          defaultValue=""
          validators={{
            onChange: ({ value }: { value: unknown }) => {
              if (value && String(value).length > PRODUCT_CONSTRAINTS.DESCRIPTION.MAX_LENGTH) {
                return PRODUCT_CONSTRAINTS.DESCRIPTION.MAX_LENGTH_MESSAGE;
              }
              return undefined;
            },
          }}
        >
          {(field: any) => (
            <FormTextarea
              fieldName="description"
              label="Description"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.state.meta.errors.length > 0}
              helperText={field.state.meta.errors[0] || ""}
              type="textarea"
              rows={3}
            />
          )}
        </form.Field>

        <Button
          variant="outlined"
          onClick={onOpenUnitSelect}
          fullWidth
          sx={{ mt: 1 }}
        >
          Select Unit {selectedUnitLabel && `(${selectedUnitLabel})`}
        </Button>
      </>
    )
  );

  const handleSelectUnit = (rowData: Record<string, unknown>) => {
    const unitData = rowData as any;
    const newUnitLabel = unitData.name + (unitData.symbol ? ` (${unitData.symbol})` : "");
    setSelectedUnitId(unitData.id);
    setSelectedUnitLabel(newUnitLabel);
    setUnitSelectOpen(false);
  };

  return (
    <>
      <ListManager
        mapping={PRODUCT_MAPPING}
        createForm={createProductFormSchema(() => setUnitSelectOpen(true))}
        editForm={createProductFormSchema(() => setUnitSelectOpen(true))}
        onCreate={async (values) => {
          if (!selectedUnitId) {
            throw new Error("Please select a unit");
          }
          await createMutation.mutateAsync({
            name: String(values.name),
            description: values.description ? String(values.description) : undefined,
            productUnitId: selectedUnitId,
          });
          setSelectedUnitId(null);
          setSelectedUnitLabel("");
        }}
        onEdit={async (id, values) => {
          await updateMutation.mutateAsync({
            id,
            name: values.name ? String(values.name) : undefined,
            description: values.description ? String(values.description) : undefined,
            productUnitId: selectedUnitId || undefined,
          });
          setSelectedUnitId(null);
          setSelectedUnitLabel("");
        }}
        onDelete={async (ids) => {
          await bulkDeleteMutation.mutateAsync(ids);
        }}
      />

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
    </>
  );
};
