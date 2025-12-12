import { createFileRoute } from "@tanstack/react-router";
import { ProductUnitsListView } from "@/components/features/inventory";

export const Route = createFileRoute("/_protected/inventory/units")({
  component: ProductUnitsPage,
});

function ProductUnitsPage() {
  return <ProductUnitsListView />;
}
