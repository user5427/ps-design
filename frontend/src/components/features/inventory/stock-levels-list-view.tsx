import { Chip } from "@mui/material";
import {
  Box,
  Stack,
} from "@mui/material";
import type { StockLevelResponse } from "@ps-design/schemas/inventory/stock-level";
import { useStockLevels } from "@/queries/inventory/stock-level";

export const StockLevelsListView = () => {
  const { data: stockLevels = [] } = useStockLevels();

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Stock Levels</h2>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {stockLevels.map((item: StockLevelResponse) => (
          <Box key={item.productId} sx={{ p: 2, border: "1px solid #ddd" }}>
            <div>{item.productName}</div>
            <div>
              {item.totalQuantity} {item.productUnit.symbol || item.productUnit.name}
            </div>
            <Chip
              label={item.isDisabled ? "Disabled" : "Active"}
              color={item.isDisabled ? "default" : "success"}
              size="small"
            />
          </Box>
        ))}
      </Box>
    </Stack>
  );
};