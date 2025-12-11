import { Box, Stack } from "@mui/material";
import { SmartPaginationList } from "@/components/elements/pagination";
import { STOCK_LEVEL_MAPPING } from "@ps-design/constants/inventory/stock-level";

export const StockLevelsListView = () => {
  return (
    <Stack spacing={2}>

      <SmartPaginationList mapping={STOCK_LEVEL_MAPPING} />
    </Stack>
  );
};