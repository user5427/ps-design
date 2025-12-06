import { Box } from "@mui/material";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { refreshToken } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

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
  return (
    <Box>
      <Outlet />
    </Box>
  );
}
