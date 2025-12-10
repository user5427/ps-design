import { createFileRoute, redirect } from "@tanstack/react-router";
import { MenuItemsListView } from "@/components/features/menu";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/menu/items")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: MenuItemsPage,
});

function MenuItemsPage() {
  return <MenuItemsListView />;
}
