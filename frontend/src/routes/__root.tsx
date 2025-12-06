// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { refreshToken } from '@/api/auth'
import { Box } from '@mui/material'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const store = useAuthStore.getState()

    try {
      const { accessToken } = await refreshToken()
      store.setAccessToken(accessToken)
    } catch {
      store.setAccessToken(null)
    }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    <Box>
      <Outlet />
    </Box>
  )
}
