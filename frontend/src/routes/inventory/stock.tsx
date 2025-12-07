import { createFileRoute, redirect } from "@tanstack/react-router";
import { StockChangesListView } from "@/components/features/inventory";
import { MainLayout } from "@/components/layouts";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/inventory/stock")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: StockPage,
});

function StockPage() {
  return (
    <MainLayout>
      <StockChangesListView />
    </MainLayout>
  );
}
