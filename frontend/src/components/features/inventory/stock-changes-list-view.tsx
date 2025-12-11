import { Chip } from "@mui/material";
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
} from "@mui/material";
import type { FormFieldDefinition, ValidationRule } from "@/components/elements/form";
import { FormModal } from "@/components/elements/form";
import {
  useCreateStockChange,
  useProducts,
  useStockChanges,
} from "@/hooks/inventory";
import type { StockChange, StockChangeType } from "@/schemas/inventory";

const stockChangeTypeColors: Record<
  StockChangeType,
  "success" | "warning" | "info" | "error"
> = {
  SUPPLY: "success",
  USAGE: "warning",
  ADJUSTMENT: "info",
  WASTE: "error",
};

const supplyValidation: ValidationRule = {
  test: (value, allValues) => {
    const qty = Number(value);
    // Pass if type is NOT supply, or if qty is valid
    if (allValues?.type !== "SUPPLY") return true;
    return !Number.isNaN(qty) && qty > 0;
  },
  message: "Quantity must be positive for Supply",
};

const wasteValidation: ValidationRule = {
  test: (value, allValues) => {
    const qty = Number(value);
    if (allValues?.type !== "WASTE") return true;
    return !Number.isNaN(qty) && qty < 0;
  },
  message: "Quantity must be negative for Waste",
};

const adjustmentValidation: ValidationRule = {
  test: (value, allValues) => {
    const qty = Number(value);
    if (allValues?.type !== "ADJUSTMENT") return true;
    return !Number.isNaN(qty) && qty !== 0;
  },
  message: "Quantity cannot be zero for Adjustment",
};

const futureExpirationDateValidation: ValidationRule = {
  test: (value) => {
    if (!value) return true; // Expiration date is optional
    const selectedDate = new Date(String(value));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today;
  },
  message: "Expiration date must be in the future",
};

export const StockChangesListView = () => {
  const {
    data: stockChanges = [],
    refetch,
  } = useStockChanges();
  const { data: products = [] } = useProducts();
  const createMutation = useCreateStockChange();

  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create";
    data?: StockChange;
  }>({
    isOpen: false,
    mode: "create",
  });

  const productOptions = useMemo(
    () =>
      products.map((p: any) => ({
        value: p.id,
        label: `${p.name} (${p.productUnit.symbol || p.productUnit.name})`,
      })),
    [products],
  );

  const typeOptions = [
    { value: "SUPPLY", label: "Supply" },
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "WASTE", label: "Waste" },
  ];

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "productId",
      label: "Product",
      type: "autocomplete",
      required: true,
      options: productOptions,
      placeholder: "Search products...",
    },
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: typeOptions,
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      required: true,
      validationRules: [
        supplyValidation,
        wasteValidation,
        adjustmentValidation,
      ],
      placeholder: "Quantity",
    },
    {
      name: "expirationDate",
      label: "Expiration Date",
      type: "date",
      validationRules: [futureExpirationDateValidation],
    },
  ];

  const handleCreateSubmit = async (values: Record<string, unknown>) => {
    await createMutation.mutateAsync({
      productId: String(values.productId),
      type: values.type as "SUPPLY" | "ADJUSTMENT" | "WASTE",
      quantity: Number(values.quantity),
      expirationDate: values.expirationDate || undefined,
    });
    setFormState({ isOpen: false, mode: "create" });
    refetch();
  };

  const handleCloseForm = () => {
    setFormState({ isOpen: false, mode: "create" });
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Stock Changes</h2>
        <Button
          variant="contained"
          onClick={() =>
            setFormState({ isOpen: true, mode: "create", data: undefined })
          }
        >
          Create Stock Change
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {stockChanges.map((item: StockChange) => (
          <Box key={item.id} sx={{ p: 2, border: "1px solid #ddd" }}>
            <div>{item.product.name}</div>
            <Chip
              label={item.type}
              color={stockChangeTypeColors[item.type]}
              size="small"
            />
            <div>
              <span style={{ color: ["USAGE", "WASTE"].includes(item.type) ? "red" : "green" }}>
                {["USAGE", "WASTE"].includes(item.type) ? "-" : "+"}
                {Math.abs(item.quantity)}
              </span>
            </div>
            {item.expirationDate && (
              <div>{new Date(item.expirationDate).toLocaleDateString()}</div>
            )}
          </Box>
        ))}
      </Box>

      <FormModal
        open={formState.isOpen && formState.mode === "create"}
        onClose={handleCloseForm}
        title="Create Stock Change"
        fields={createFormFields}
        onSubmit={handleCreateSubmit}
      />
    </Stack>
  );
};