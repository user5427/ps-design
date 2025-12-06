// src/routes/__root.tsx

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

    try {
      const { accessToken } = await refreshToken();
      store.setAccessToken(accessToken);
    } catch {
      store.setAccessToken(null);
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
