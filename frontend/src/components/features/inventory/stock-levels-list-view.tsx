import { AutoRecordListView } from "@/components/elements/record-list-view";
import { STOCK_LEVEL_MAPPING } from "@ps-design/constants/inventory";

export const StockLevelsListView = () => {
  return (
    <AutoRecordListView
      mapping={STOCK_LEVEL_MAPPING}
      hasViewAction={true}
    />
  );
};
