import { createFileRoute } from "@tanstack/react-router";
import { ProductsListView } from "@/components/features/inventory";

export const Route = createFileRoute("/_protected/inventory/products")({
  component: ProductsPage,
});

function ProductsPage() {
  return <ProductsListView />;
}
