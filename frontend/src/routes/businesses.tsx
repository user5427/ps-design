import { createFileRoute, redirect } from "@tanstack/react-router";
import { BusinessListPage } from "@/components/features/business/business-list-page";
import { useAuthStore } from "@/store/auth";
import { URLS } from "@/constants/urls";

export const Route = createFileRoute("/businesses")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: BusinessListPage,
});
