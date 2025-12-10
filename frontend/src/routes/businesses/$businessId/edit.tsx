import { createFileRoute, redirect } from "@tanstack/react-router";
import { BusinessEdit } from "@/components/features/business";
import { useAuthStore } from "@/store/auth";
import { URLS } from "@/constants/urls";

export const Route = createFileRoute("/businesses/$businessId/edit")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: BusinessEditPage,
});

function BusinessEditPage() {
  return <BusinessEdit />;
}
