import { createFileRoute, redirect } from "@tanstack/react-router";
import { CategoriesListView } from "@/components/features/categories";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/categories")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: CategoriesPage,
});

function CategoriesPage() {
  return <CategoriesListView />;
}
