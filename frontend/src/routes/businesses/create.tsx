import { createFileRoute, redirect } from "@tanstack/react-router";
import { BusinessCreate } from "@/components/features/business/business-create";
import { useAuthStore } from "@/store/auth";
import { URLS } from "@/constants/urls";

export const Route = createFileRoute("/businesses/create")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: BusinessCreatePage,
});

function BusinessCreatePage() {
  return <BusinessCreate/>;
}