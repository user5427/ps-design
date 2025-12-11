import { AutoRecordListView } from "@/components/elements/record-list-view";
import { STOCK_CHANGE_MAPPING } from "@ps-design/constants/inventory";
import { useCreateStockChange } from "@/queries/inventory/stock";
import type { StockChangeResponse } from "@ps-design/schemas/inventory/stock-change";

export const StockChangesListView = () => {
  const createMutation = useCreateStockChange();

  const handleCreate = async (values: Partial<StockChangeResponse>) => {
    await createMutation.mutateAsync({
      productId: String(values.productId),
      type: values.type as "SUPPLY" | "ADJUSTMENT" | "WASTE",
      quantity: Number(values.quantity),
      expirationDate: values.expirationDate || undefined,
    });
  };

  return (
    <AutoRecordListView
      mapping={STOCK_CHANGE_MAPPING}
      onCreate={handleCreate}
    />
  );
};
