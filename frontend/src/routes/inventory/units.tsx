import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProductUnitsListView } from "@/components/features/inventory";
import { MainLayout } from "@/components/layouts";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/inventory/units")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: ProductUnitsPage,
});

function ProductUnitsPage() {
  return (
    <MainLayout>
      <ProductUnitsListView />
    </MainLayout>
  );
}
