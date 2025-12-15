import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminUsersManagement } from "@/components/features/admin/users";
import { useAuthStore } from "@/store/auth";
import { URLS } from "@/constants/urls";

export const Route = createFileRoute("/manage/users")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: ManageUsersPage,
});

function ManageUsersPage() {
  return <AdminUsersManagement />;
}
