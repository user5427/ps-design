import { Box } from "@mui/material";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useRefreshToken } from "@/queries/auth";
import { MainLayout, PublicLayout } from "@/components/layouts";
import { AppBar } from "@/components/layouts/app-bar/app-bar";
import { AppBarData } from "@/constants/app-bar";
import { useAuthStore } from "@/store/auth";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const store = useAuthStore();
  const refreshTokenMutation = useRefreshToken();

  useEffect(() => {
    // Only attempt refresh token on first load
    if (!store.isAuthInitialized()) {
      refreshTokenMutation.mutate(undefined, {
        onSuccess: (data) => {
          store.setAccessToken(data.accessToken);
          store.setInitialized(true);
        },
        onError: (error) => {
          console.error("Failed to refresh token:", error);
          store.setAccessToken(null);
          store.setInitialized(true);
        },
      });
    }
  }, []);

  const isPublicRoute = ["/", "/auth/login", "/auth/change-password"].includes(
    location.pathname,
  );
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
