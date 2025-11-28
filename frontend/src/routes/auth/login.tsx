import { Login } from '@/components/features/'
import { MainLayout, AppBar } from '@/components/layouts'
import Box from '@mui/material/Box'
import { createFileRoute } from '@tanstack/react-router'
import { AppBarData } from '@/constants'
export const Route = createFileRoute('/auth/login')({
    component: RouteComponent,
})


function RouteComponent() {
    return (
        <MainLayout>
            <AppBar {...AppBarData} />
            <Box sx={{ textAlign: 'center', mt: 8 }}>
                <Login />
            </Box>
        </MainLayout>
    )
}