import { createFileRoute, redirect } from "@tanstack/react-router";
import { StockLevelsListView } from "@/components/features/inventory";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/inventory/stock-levels")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: StockLevelsPage,
});

function StockLevelsPage() {
  return <StockLevelsListView />;
}
