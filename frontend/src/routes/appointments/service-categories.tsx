import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth";
import { URLS } from "@/constants/urls";
import { ServiceCategoriesListView } from "@/components/features/appointments";

export const Route = createFileRoute("/appointments/service-categories")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: ServiceCategoriesPage,
});

function ServiceCategoriesPage() {
  return <ServiceCategoriesListView />;
}
