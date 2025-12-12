import { useState } from "react";
import type React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
} from "@mui/material";
import { useCreateStockChange } from "@/queries/inventory/stock-change";
import { SmartPaginationList } from "@/components/elements/pagination";
import { STOCK_CHANGE_MAPPING, STOCK_CHANGE_CONSTRAINTS } from "@ps-design/constants/inventory/stock-change";
import { PRODUCT_MAPPING } from "@ps-design/constants/inventory/product";
import { FormNumber, FormSelect } from "@/components/elements/form-builder";
import { ListManager } from "@/components/elements/list-manager";

const typeOptions = [
  { id: "SUPPLY", label: "Supply" },
  { id: "ADJUSTMENT", label: "Adjustment" },
  { id: "WASTE", label: "Waste" },
];

// Form generator function
const createStockChangeForm = (selectedProductLabel: string, onOpenProductSelect: () => void): ((form: any) => React.ReactNode) => (
  (form: any) => (
    <>
      <form.Field
        name="type"
        defaultValue=""
        validators={{
          onChange: ({ value }: { value: unknown }) => {
            if (!value || String(value).trim().length === 0) {
              return "Type is required";
            }
            return undefined;
          },
        }}
      >
        {(field: any) => (
          <FormSelect
            fieldName="type"
            label="Type"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={field.state.meta.errors.length > 0}
            helperText={field.state.meta.errors[0] || ""}
            type="select"
            required
            options={typeOptions}
          />
        )}
      </form.Field>

      <form.Field
        name="quantity"
        defaultValue={0}
        validators={{
          onChange: ({ value }: { value: unknown }) => {
            if (value === 0 || !value) return "Quantity is required";
            if (Number(value) <= 0) return "Quantity must be greater than 0";
            if (Number(value) > STOCK_CHANGE_CONSTRAINTS.QUANTITY.MAX_VALUE) {
              return STOCK_CHANGE_CONSTRAINTS.QUANTITY.MAX_VALUE_MESSAGE;
            }
            return undefined;
          },
        }}
      >
        {(field: any) => (
          <FormNumber
            fieldName="quantity"
            label="Quantity"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={field.state.meta.errors.length > 0}
            helperText={field.state.meta.errors[0] || ""}
            type="number"
            required
          />
        )}
      </form.Field>

      <Button
        variant="outlined"
        onClick={onOpenProductSelect}
        fullWidth
        sx={{ mt: 1 }}
      >
        Select Product {selectedProductLabel && `(${selectedProductLabel})`}
      </Button>
    </>
  )
);

export const StockChangesListView = () => {
  const createMutation = useCreateStockChange();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductLabel, setSelectedProductLabel] = useState<string>("");
  const [productSelectOpen, setProductSelectOpen] = useState(false);

  const handleSelectProduct = (rowData: Record<string, unknown>) => {
    const productData = rowData as any;
    setSelectedProductId(productData.id);
    setSelectedProductLabel(productData.name);
    setProductSelectOpen(false);
  };

  return (
    <>
      <ListManager
        mapping={STOCK_CHANGE_MAPPING}
        createForm={createStockChangeForm(selectedProductLabel, () => setProductSelectOpen(true))}
        onCreate={async (values) => {
          if (!selectedProductId) {
            throw new Error("Please select a product");
          }
          await createMutation.mutateAsync({
            productId: selectedProductId,
            type: String(values.type) as "SUPPLY" | "ADJUSTMENT" | "WASTE",
            quantity: Number(values.quantity),
            expirationDate: values.expirationDate ? String(values.expirationDate) : undefined,
          });
          setSelectedProductId(null);
          setSelectedProductLabel("");
        }}
        createModalTitle="Create Stock Change"
      />

      <Dialog
        open={productSelectOpen}
        onClose={() => setProductSelectOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Product</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          <Box sx={{ mt: 2 }}>
            <SmartPaginationList
              mapping={PRODUCT_MAPPING}
              onSelect={handleSelectProduct}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
