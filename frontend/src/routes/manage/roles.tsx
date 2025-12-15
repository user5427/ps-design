import { createFileRoute, redirect } from "@tanstack/react-router";
import { ManageRoles } from "@/components/features/manage";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/manage/roles")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: ManageRolesPage,
});

function ManageRolesPage() {
  return <ManageRoles />;
}
