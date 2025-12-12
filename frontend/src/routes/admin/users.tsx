import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminUsersManagement } from "@/components/features/admin/users";
import { useAuthStore } from "@/store/auth";
import { URLS } from "@/constants/urls";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return <AdminUsersManagement />;
}
