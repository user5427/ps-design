import { Box } from "@mui/material";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet, useLocation } from "@tanstack/react-router";
import { refreshToken } from "@/api/auth";
import { AppBar } from "@/components/layouts/app-bar";
import { AppBarData } from "@/constants/app-bar";
import { useAuthStore } from "@/store/auth";
import { MainLayout, PublicLayout } from "@/components/layouts";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const store = useAuthStore.getState();

    // Only attempt refresh token on first load
    if (!store.isAuthInitialized()) {
      try {
        const { accessToken } = await refreshToken();
        store.setAccessToken(accessToken);
      } catch {
        store.setAccessToken(null);
      } finally {
        store.setInitialized(true);
      }
    }
  },
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const isPublicRoute = ["/", "/auth/login", "/auth/change-password"].includes(location.pathname);
  const Layout = isPublicRoute ? PublicLayout : MainLayout;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
    <AppBar {...AppBarData} />
      <Layout>
        <Outlet />
      </Layout>
    </Box>
  );
}
