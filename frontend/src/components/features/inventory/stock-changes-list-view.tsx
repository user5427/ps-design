import { Chip } from "@mui/material";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  type ValidationRule,
} from "@/components/elements/record-list-view";
import {
  useCreateStockChange,
  useStockChanges,
} from "@/queries/inventory/stock";
import type { StockChange, StockChangeType } from "@/schemas/inventory";
import { useProducts } from "@/queries/inventory/products";

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
    isLoading,
    error,
    refetch,
  } = useStockChanges();
  const { data: products = [] } = useProducts();
  const createMutation = useCreateStockChange();

  const columns = useMemo<MRT_ColumnDef<StockChange>[]>(
    () => [
      {
        accessorKey: "product.name",
        header: "Product",
        size: 200,
        Cell: ({ row }) => row.original.product.name,
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 120,
        Cell: ({ cell }) => {
          const type = cell.getValue<StockChangeType>();
          return (
            <Chip
              label={type}
              color={stockChangeTypeColors[type]}
              size="small"
            />
          );
        },
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        size: 150,
        Cell: ({ cell, row }) => {
          const qty = cell.getValue<number>();
          const type = row.original.type;
          const isNegative = ["USAGE", "WASTE"].includes(type);
          return (
            <span style={{ color: isNegative ? "red" : "green" }}>
              {isNegative ? "-" : "+"}
              {Math.abs(qty)}
            </span>
          );
        },
      },
      {
        accessorKey: "expirationDate",
        header: "Expiration",
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ? new Date(value).toLocaleDateString() : "";
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ? new Date(value).toLocaleString() : "-";
        },
      },
    ],
    [],
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
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

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    {
      name: "product",
      label: "Product",
      render: (value) => {
        const product = value as {
          name: string;
          productUnit?: { name: string; symbol?: string | null };
        };
        if (!product) return "-";
        const unitLabel =
          product.productUnit?.symbol || product.productUnit?.name || "";
        return `${product.name}${unitLabel ? ` (${unitLabel})` : ""}`;
      },
    },
    {
      name: "type",
      label: "Type",
      render: (value) => {
        const type = value as StockChangeType;
        return (
          <Chip label={type} color={stockChangeTypeColors[type]} size="small" />
        );
      },
    },
    {
      name: "quantity",
      label: "Quantity",
      render: (value, record) => {
        const qty = value as number;
        const type = record.type as StockChangeType;
        const isNegative = ["USAGE", "WASTE"].includes(type);
        return (
          <span style={{ color: isNegative ? "red" : "green" }}>
            {isNegative ? "-" : "+"}
            {Math.abs(qty)}
          </span>
        );
      },
    },
    { name: "expirationDate", label: "Expiration Date" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<StockChange>) => {
    // Form only contains create fields (productId, type, quantity, expirationDate)
    // Type is restricted by CreateChangeTypeEnum in the form
    await createMutation.mutateAsync({
      productId: String(values.productId),
      type: values.type as "SUPPLY" | "ADJUSTMENT" | "WASTE",
      quantity: Number(values.quantity),
      expirationDate: values.expirationDate || undefined,
    });
  };

  return (
    <RecordListView<StockChange>
      title="Stock Changes"
      columns={columns}
      data={stockChanges}
      isLoading={isLoading}
      error={error}
      createFormFields={createFormFields}
      editFormFields={[]}
      viewFields={viewFields}
      onCreate={handleCreate}
      onSuccess={() => refetch()}
    />
  );
};
