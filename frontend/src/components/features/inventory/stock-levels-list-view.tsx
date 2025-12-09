import { Chip } from "@mui/material";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import { RecordListView } from "@/components/elements/record-list-view";
import { useStockLevels } from "@/hooks/inventory";
import type { StockLevel } from "@/schemas/inventory";

export const StockLevelsListView = () => {
  const {
    data: stockLevels = [],
    isLoading,
    error,
  } = useStockLevels();

  const columns = useMemo<MRT_ColumnDef<StockLevel>[]>(
    () => [
      {
        accessorKey: "productName",
        header: "Product",
        size: 250,
      },
      {
        accessorKey: "productUnit.name",
        header: "Unit",
        size: 150,
        Cell: ({ row }) => {
          const unit = row.original.productUnit;
          return unit.symbol || unit.name;
        },
      },
      {
        accessorKey: "totalQuantity",
        header: "Quantity",
        size: 150,
        Cell: ({ cell, row }) => {
          const qty = cell.getValue<number>();
          const unit = row.original.productUnit;
          const unitLabel = unit.symbol || unit.name;
          return `${qty} ${unitLabel}`;
        },
      },
      {
        accessorKey: "isDisabled",
        header: "Status",
        size: 120,
        Cell: ({ cell }) => {
          const isDisabled = cell.getValue<boolean>();
          return (
            <Chip
              label={isDisabled ? "Disabled" : "Active"}
              color={isDisabled ? "default" : "success"}
              size="small"
            />
          );
        },
      },
    ],
    []
  );

  return (
    <RecordListView<StockLevel>
      title="Stock Levels"
      data={stockLevels}
      columns={columns}
      isLoading={isLoading}
      error={error}
      getRowId={(row) => row.productId}
      hasViewAction={true}
    />
  );
};
