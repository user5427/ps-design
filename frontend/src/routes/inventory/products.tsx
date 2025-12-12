import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProductsListView } from "@/components/features/inventory";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/inventory/products")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: ProductsPage,
});

function ProductsPage() {
  return <ProductsListView />;
}
