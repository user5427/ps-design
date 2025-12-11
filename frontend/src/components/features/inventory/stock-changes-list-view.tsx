import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
} from "@mui/material";
import type { FormFieldDefinition, ValidationRule } from "@/components/elements/form";
import { FormModal } from "@/components/elements/form";
import type { StockChangeResponse } from "@ps-design/schemas/inventory/stock-change";
import { useCreateStockChange } from "@/queries/inventory/stock-change";
import { SmartPaginationList } from "@/components/elements/pagination";
import { STOCK_CHANGE_MAPPING } from "@ps-design/constants/inventory/stock-change";

const supplyValidation: ValidationRule = {
  test: (value, allValues) => {
    const qty = Number(value);
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
    if (!value) return true;
    const selectedDate = new Date(String(value));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today;
  },
  message: "Expiration date must be in the future",
};

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

  const formFields: FormFieldDefinition[] = [
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
        fields={formFields}
        onSubmit={handleCreateSubmit}
      />
    </Stack>
  );
};