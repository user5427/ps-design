import { createFileRoute, redirect } from "@tanstack/react-router";
import { BusinessList } from "@/components/features/manage";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/manage/businesses")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: BusinessesPage,
});

function BusinessesPage() {
  return <BusinessList />;
}
