import { createFileRoute } from "@tanstack/react-router";
import { StockChangesListView } from "@/components/features/inventory";

export const Route = createFileRoute("/_protected/inventory/stock")({
  component: StockPage,
});

function StockPage() {
  return <StockChangesListView />;
}
