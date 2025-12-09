import { Chip } from "@mui/material";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  type ViewFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
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
        Cell: ({ row }) =>
          row.original.product.name,
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
    []
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.productUnit.symbol || p.productUnit.name})`,
      })),
    [products]
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
      validationRules: [ValidationRules.min(0.01, "Quantity must be greater than 0")],
    },
    {
      name: "expirationDate",
      label: "Expiration Date",
      type: "date",
    },
  ];

  const viewFields: ViewFieldDefinition[] = [
    { name: "id", label: "ID" },
    { 
      name: "product", 
      label: "Product",
      render: (value) => {
        const product = value as { name: string; productUnit?: { name: string; symbol?: string | null } };
        if (!product) return "-";
        const unitLabel = product.productUnit?.symbol || product.productUnit?.name || "";
        return `${product.name}${unitLabel ? ` (${unitLabel})` : ""}`;
      }
    },
    { 
      name: "type", 
      label: "Type",
      render: (value) => {
        const type = value as StockChangeType;
        return (
          <Chip
            label={type}
            color={stockChangeTypeColors[type]}
            size="small"
          />
        );
      }
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
      }
    },
    { name: "expirationDate", label: "Expiration Date" },
    { name: "createdAt", label: "Created At" },
    { name: "updatedAt", label: "Updated At" },
  ];

  const handleCreate = async (values: Partial<StockChange>) => {
    // Form only contains create fields (productId, type, quantity, expirationDate)
    // Type is restricted by CreateChangeTypeEnum in the form
    await createMutation.mutateAsync({
      productId: values.productId!,
      type: values.type as "SUPPLY" | "ADJUSTMENT" | "WASTE",
      quantity: values.quantity!,
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
