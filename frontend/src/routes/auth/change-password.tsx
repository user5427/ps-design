import { ChangePassword } from '@/components/features/auth'
import { AppBar, MainLayout } from '@/components/layouts'
import { AppBarData } from '@/constants'
import { useAuthStore } from '@/store/auth'
import { Box } from '@mui/material'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute("/auth/change-password")({
    beforeLoad: async () => {
        const store = useAuthStore.getState();
        const token = store.getAccessToken();
        if (!token) {
            throw redirect({ to: "/" });
        }
    },
    component: ChangePasswordPage,
});

function ChangePasswordPage() {
    return (
        <MainLayout>
            <AppBar {...AppBarData} />
            <Box sx={{ textAlign: 'center', mt: 8 }}>
                <ChangePassword />
            </Box>
        </MainLayout>
    )
}
