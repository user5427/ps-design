import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Box } from '@mui/material'

interface RouterContext {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
})

function RootComponent() {
    return (
        <Box>
            {/* Outlet renders whatever route matches (/, /auth/login, etc.) */}
            <Outlet />
        </Box>
    )
}