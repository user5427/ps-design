import { createFileRoute, redirect } from "@tanstack/react-router";
import { Login } from "@/components/features/auth";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth/auth-store";

export const Route = createFileRoute("/auth/login")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (token) {
      throw redirect({ to: URLS.DASHBOARD });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
      <Login />
  );
}
