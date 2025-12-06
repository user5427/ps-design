import { createFileRoute, redirect } from "@tanstack/react-router";
import { Register } from "@/components/features/auth";
import { MainLayout } from "@/components/layouts/main-layout";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/auth/register")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (token) {
      throw redirect({ to: URLS.DASHBOARD });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <MainLayout isBarHidden>
      <Register />
    </MainLayout>
  );
}
