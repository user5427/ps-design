import { createFileRoute, redirect } from "@tanstack/react-router";
import { MyBusinessUsers } from "@/components/features/manage";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/my-business/users")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.LOGIN });
    }
  },
  component: MyBusinessUsersPage,
});

function MyBusinessUsersPage() {
  return <MyBusinessUsers />;
}
