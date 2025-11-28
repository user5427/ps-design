import { Register } from '@/components/features'
import { MainLayout } from '@/components/layouts/MainLayout'
import Box from '@mui/material/Box'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/register')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <MainLayout>
            <Box sx={{ textAlign: 'center', mt: 8 }}>
                <Register />
            </Box>
        </MainLayout>
    )
}
