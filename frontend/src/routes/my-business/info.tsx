import { createFileRoute, redirect } from "@tanstack/react-router";
import { BusinessInfoManagement } from "@/components/features/my-business/business-info";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/my-business/info")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: MyBusinessInfoPage,
});

function MyBusinessInfoPage() {
  return <BusinessInfoManagement />;
}
