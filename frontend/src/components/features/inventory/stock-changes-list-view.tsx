import { useState, useRef } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { FormModal } from "@/components/elements/form";
import type { StockChangeResponse } from "@ps-design/schemas/inventory/stock-change";
import { useCreateStockChange } from "@/queries/inventory/stock-change";
import { SmartPaginationList, type SmartPaginationListRef } from "@/components/elements/pagination";
import { STOCK_CHANGE_MAPPING, STOCK_CHANGE_CONSTRAINTS } from "@ps-design/constants/inventory/stock-change";
import { PRODUCT_MAPPING } from "@ps-design/constants/inventory/product";

export const StockChangesListView = () => {
  const listRef = useRef<SmartPaginationListRef>(null);
  const createMutation = useCreateStockChange();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create";
    data?: StockChangeResponse;
  }>({
    isOpen: false,
    mode: "create",
  });

  const [productSelectOpen, setProductSelectOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductLabel, setSelectedProductLabel] = useState<string>("");

  const typeOptions = [
    { value: "SUPPLY", label: "Supply" },
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "WASTE", label: "Waste" },
  ];

  const handleCreateSubmit = async (values: Record<string, unknown>) => {
    if (!selectedProductId) {
      alert("Please select a product");
      return;
    }
    await createMutation.mutateAsync({
      productId: selectedProductId,
      type: values.type as "SUPPLY" | "ADJUSTMENT" | "WASTE",
      quantity: Number(values.quantity),
      expirationDate: values.expirationDate ? String(values.expirationDate) : undefined,
    });
    setFormState({ isOpen: false, mode: "create" });
    setSelectedProductId(null);
    setSelectedProductLabel("");
    // Refetch the list after creating
    await listRef.current?.refetch();
  };

  const handleSelectProduct = (rowData: Record<string, unknown>) => {
    const productData = rowData as any;
    setSelectedProductId(productData.id);
    setSelectedProductLabel(productData.name);
    setProductSelectOpen(false);
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
          Create {STOCK_CHANGE_MAPPING.displayName}
        </Button>
      </Box>

      <SmartPaginationList
        ref={listRef}
        mapping={STOCK_CHANGE_MAPPING}
      />

      <FormModal
        open={formState.isOpen && formState.mode === "create"}
        onClose={handleCloseForm}
        title={`Create ${STOCK_CHANGE_MAPPING.displayName}`}
        initialValues={{ 
          productId: selectedProductLabel,
          type: STOCK_CHANGE_CONSTRAINTS.TYPE.SUPPLY,
          quantity: "",
          expirationDate: ""
        }}
        onSubmit={handleCreateSubmit}
      >
        {(form: any) => (
          <Stack spacing={2}>
            <form.Field
              name="productId"
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (!value || String(value).trim().length === 0) {
                    return "Product is required";
                  }
                  return undefined;
                },
              }}
            >
              {(field: any) => (
                <TextField
                  fullWidth
                  label="Product"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Click 'Select Product' button"
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0] || "Select a product"}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  required
                />
              )}
            </form.Field>
            <Button
              variant="outlined"
              onClick={() => setProductSelectOpen(true)}
              fullWidth
            >
              Select Product
            </Button>

            <form.Field
              name="type"
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
                <TextField
                  fullWidth
                  select
                  label="Type"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0]}
                  required
                >
                  {typeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </form.Field>

            <form.Field
              name="quantity"
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (!value && value !== 0) {
                    return "Quantity is required";
                  }
                  const qty = Number(value);
                  if (Number.isNaN(qty)) {
                    return "Quantity must be a number";
                  }
                  
                  const type = form.getFieldValue("type");
                  if (type === STOCK_CHANGE_CONSTRAINTS.TYPE.SUPPLY && qty <= 0) {
                    return STOCK_CHANGE_CONSTRAINTS.QUANTITY.SUPPLY_MESSAGE;
                  }
                  if (type === STOCK_CHANGE_CONSTRAINTS.TYPE.WASTE && qty >= 0) {
                    return STOCK_CHANGE_CONSTRAINTS.QUANTITY.WASTE_MESSAGE;
                  }
                  if (type === STOCK_CHANGE_CONSTRAINTS.TYPE.ADJUSTMENT && qty === 0) {
                    return STOCK_CHANGE_CONSTRAINTS.QUANTITY.ADJUSTMENT_MESSAGE;
                  }
                  return undefined;
                },
              }}
            >
              {(field: any) => (
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
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
              name="expirationDate"
              validators={{
                onChange: ({ value }: { value: unknown }) => {
                  if (!value) return undefined;
                  
                  const selectedDate = new Date(String(value));
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (selectedDate <= today) {
                    return "Expiration date must be in the future";
                  }
                  return undefined;
                },
              }}
            >
              {(field: any) => (
                <TextField
                  fullWidth
                  type="date"
                  label="Expiration Date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0]}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </form.Field>
          </Stack>
        )}
      </FormModal>

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
    </Stack>
  );
};
