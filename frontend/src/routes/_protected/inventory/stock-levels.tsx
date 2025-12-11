import { createFileRoute } from "@tanstack/react-router";
import { StockLevelsListView } from "@/components/features/inventory";

export const Route = createFileRoute("/_protected/inventory/stock-levels")({
  component: StockLevelsPage,
});

function StockLevelsPage() {
  return <StockLevelsListView />;
}
