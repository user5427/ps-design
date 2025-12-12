import { createFileRoute, redirect } from "@tanstack/react-router";
import { MenuCategoriesListView } from "@/components/features/menu";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/_protected/menu/categories")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: MenuCategoriesPage,
});

function MenuCategoriesPage() {
  return <MenuCategoriesListView />;
}
