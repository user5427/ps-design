import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
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
  component: BusinessLayoutPage,
});

function BusinessLayoutPage() {
  return <Outlet />;
}
