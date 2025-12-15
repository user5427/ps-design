import { createFileRoute, redirect } from "@tanstack/react-router";
import { BusinessRoles } from "@/components/features/manage";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/my-business/roles")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: MyBusinessRolesPage,
});

function MyBusinessRolesPage() {
  return <BusinessRoles />;
}
