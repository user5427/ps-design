import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";
import { FormModal } from "@/components/elements/form";
import type { StockChangeResponse } from "@ps-design/schemas/inventory/stock-change";
import { useCreateStockChange } from "@/queries/inventory/stock-change";
import { SmartPaginationList } from "@/components/elements/pagination";
import { STOCK_CHANGE_MAPPING } from "@ps-design/constants/inventory/stock-change";

export const StockChangesListView = () => {
  const createMutation = useCreateStockChange();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create";
    data?: StockChangeResponse;
  }>({
    isOpen: false,
    mode: "create",
  });

  // Note: Product options would need to be populated from a separate query
  // For now, using empty array - this should be populated from products endpoint
  const productOptions = useMemo(() => [], []);

  const typeOptions = [
    { value: "SUPPLY", label: "Supply" },
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "WASTE", label: "Waste" },
  ];

  const validateQuantity = (value: unknown, type: unknown) => {
    const qty = Number(value);
    if (Number.isNaN(qty)) return "Quantity must be a number";

    if (type === "SUPPLY" && qty <= 0) return "Quantity must be positive for Supply";
    if (type === "WASTE" && qty >= 0) return "Quantity must be negative for Waste";
    if (type === "ADJUSTMENT" && qty === 0) return "Quantity cannot be zero for Adjustment";

    return null;
  };

  const validateExpirationDate = (value: unknown) => {
    if (!value) return null;
    const selectedDate = new Date(String(value));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate <= today ? "Expiration date must be in the future" : null;
  };

  const handleCreateSubmit = async (values: Record<string, unknown>) => {
    await createMutation.mutateAsync({
      productId: String(values.productId),
      type: values.type as "SUPPLY" | "ADJUSTMENT" | "WASTE",
      quantity: Number(values.quantity),
      expirationDate: values.expirationDate ? String(values.expirationDate) : undefined,
    });
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
        <h2>{STOCK_CHANGE_MAPPING.displayName}</h2>
        <Button variant="contained" onClick={openCreateForm}>
          Create {STOCK_CHANGE_MAPPING.displayName}
        </Button>
      </Box>

      <SmartPaginationList
        mapping={STOCK_CHANGE_MAPPING}
      />

      <FormModal
        open={formState.isOpen && formState.mode === "create"}
        onClose={handleCloseForm}
        title={`Create ${STOCK_CHANGE_MAPPING.displayName}`}
        initialValues={{ 
          productId: "",
          type: "SUPPLY",
          quantity: "",
          expirationDate: ""
        }}
        onSubmit={handleCreateSubmit}
      >
        {(form: any) => (
          <Stack spacing={2}>
            <form.Field
              name="productId"
              children={(field: any) => (
                <TextField
                  fullWidth
                  select
                  label="Product"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={!!field.state.meta.errors.length}
                  helperText={field.state.meta.errors[0]}
                  required
                >
                  {productOptions.length === 0 ? (
                    <MenuItem disabled>No products available</MenuItem>
                  ) : (
                    productOptions.map((opt: any) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              )}
            />

            <form.Field
              name="type"
              children={(field: any) => (
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
            />

            <form.Field
              name="quantity"
              children={(field: any) => {
                const error = field.state.meta.errors.length 
                  ? field.state.meta.errors[0]
                  : validateQuantity(field.state.value, form.getFieldValue("type"));
                return (
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!error}
                    helperText={error}
                    required
                  />
                );
              }}
            />

            <form.Field
              name="expirationDate"
              children={(field: any) => {
                const error = field.state.meta.errors.length 
                  ? field.state.meta.errors[0]
                  : validateExpirationDate(field.state.value);
                return (
                  <TextField
                    fullWidth
                    type="date"
                    label="Expiration Date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!error}
                    helperText={error}
                    InputLabelProps={{ shrink: true }}
                  />
                );
              }}
            />
          </Stack>
        )}
      </FormModal>
    </Stack>
  );
};
