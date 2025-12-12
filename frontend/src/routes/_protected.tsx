import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { URLS } from "@/constants/urls";
import { useAuthStore } from "@/store/auth";
import { Box } from "@mui/material";
import { Sidebar } from "@/components/layouts/side-bar";
import { sidebarSections } from "@/constants";
import { Layout } from "@/components/layouts/layout";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (!token) {
      throw redirect({ to: URLS.HOME });
    }
  },
  component: () => <ProtectedComponent />,
});

function ProtectedComponent() {
  return (
    <Box>
      <Sidebar sidebarSections={sidebarSections} />
      <Layout>
        <Outlet />
      </Layout>
    </Box>
  );
}
