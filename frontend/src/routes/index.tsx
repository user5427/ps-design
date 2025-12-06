import { createFileRoute, redirect } from '@tanstack/react-router'
import { Box, Typography, Button } from '@mui/material'
import { Link } from '@tanstack/react-router'
import { MainLayout } from '@/components/layouts/main-layout'
import { useAuthStore } from '@/store/auth'
import { URLS } from '@/constants/urls'

export const Route = createFileRoute("/")({
    beforeLoad: async () => {
        const store = useAuthStore.getState();
        const token = store.getAccessToken();
        if (token) {
            throw redirect({ to: URLS.DASHBOARD });
        }
    },
    component: HomePage,
});


function HomePage() {
    return (
        <MainLayout isBarHidden>
            <Box sx={{ textAlign: 'center', mt: 8, flex: 1, alignItems: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h2" gutterBottom>
                    Welcome to ADEPI
                </Typography>
                <Typography variant="h5" color="text.secondary" component='p'>
                    Your ADEPI homepage
                </Typography>
                <Button
                    component={Link}
                    to={URLS.LOGIN}
                    variant="contained"
                    size="large"
                >
                    Get Started
                </Button>
            </Box>
        </MainLayout>
    )
}

