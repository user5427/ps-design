import { ChangePassword } from '@/components/features/auth'
import { AppBar, MainLayout } from '@/components/layouts'
import { AppBarData } from '@/constants'
import { Box } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/change-password')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <MainLayout>
            <AppBar {...AppBarData} />
            <Box sx={{ textAlign: 'center', mt: 8 }}>
                <ChangePassword />
            </Box>
        </MainLayout>
    )
}
