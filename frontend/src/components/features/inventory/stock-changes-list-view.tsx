import { Chip } from "@mui/material";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import {
  RecordListView,
  type FormFieldDefinition,
  ValidationRules,
} from "@/components/elements/record-list-view";
import {
  useCreateStockChange,
  useDeleteStockChange,
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
  const deleteMutation = useDeleteStockChange();

  const columns = useMemo<MRT_ColumnDef<StockChange>[]>(
    () => [
      {
        accessorKey: "product.name",
        header: "Product",
        size: 200,
        Cell: ({ row }) =>
          row.original.product?.name || row.original.productId.slice(0, 8),
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
        size: 100,
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
          return value ? new Date(value).toLocaleDateString() : "-";
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
        label: p.name,
      })),
    [products]
  );

  const typeOptions = [
    { value: "SUPPLY", label: "Supply" },
    { value: "USAGE", label: "Usage" },
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "WASTE", label: "Waste" },
  ];

  const createFormFields: FormFieldDefinition[] = [
    {
      name: "productId",
      label: "Product",
      type: "select",
      required: true,
      options: productOptions,
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

  const handleCreate = async (values: Partial<StockChange>) => {
    await createMutation.mutateAsync({
      productId: values.productId!,
      type: values.type!,
      quantity: values.quantity!,
      expirationDate: values.expirationDate || undefined,
    });
  };

  // Stock changes cannot be edited, only deleted
  const handleEdit = async () => {
    throw new Error("Stock changes cannot be edited");
  };

  const handleDelete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id)));
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
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSuccess={() => refetch()}
    />
  );
};
