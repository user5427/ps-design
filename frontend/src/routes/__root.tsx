import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Box } from '@mui/material'
import { useEffect, useState } from 'react'
import { setRouterInstance } from '@/api/client/client'
import { useAuthStore } from '@/store/auth'
import { refreshToken } from '@/api/auth'

interface RouterContext {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
})

function RootComponent() {
    const router = useRouter()
    const [isInitialized, setIsInitialized] = useState(false)
    const store = useAuthStore()

    useEffect(() => {
        setRouterInstance(router)
    }, [router])

    // Initialize auth on app load by trying to refresh token from cookie
    // This runs only once per app session
    useEffect(() => {
        let isMounted = true

        const initializeAuth = async () => {
            try {
                const { accessToken } = await refreshToken()
                if (isMounted) {
                    store.setAccessToken(accessToken)
                }
            } catch (error) {
                if (isMounted) {
                    store.setAccessToken(null)
                }
            } finally {
                if (isMounted) {
                    setIsInitialized(true)
                }
            }
        }

        initializeAuth()

        return () => {
            isMounted = false
        }
    }, []) 

    // Don't render until we've checked for existing session
    if (!isInitialized) {
        return null
    }

    return (
        <Box>
            {/* Outlet renders whatever route matches (/, /auth/login, etc.) */}
            <Outlet />
        </Box>
    )
}