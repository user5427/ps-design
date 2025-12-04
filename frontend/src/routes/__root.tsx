import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Box } from '@mui/material'
import { useEffect } from 'react'
import { setRouterInstance } from '@/api/client/client'

interface RouterContext {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
})

function RootComponent() {
    const router = useRouter()

    useEffect(() => {
        setRouterInstance(router)
    }, [router])

    return (
        <Box>
            {/* Outlet renders whatever route matches (/, /auth/login, etc.) */}
            <Outlet />
        </Box>
    )
}