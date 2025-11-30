import { createFileRoute } from '@tanstack/react-router'
import { Box, Typography, Button } from '@mui/material'
import { Link } from '@tanstack/react-router'
import { MainLayout } from '@/components/layouts/main-layout'

export const Route = createFileRoute('/')({
    component: HomePage,
})

function HomePage() {
    return (
        <MainLayout>
            <Box sx={{ textAlign: 'center', mt: 8 }}>
                <Typography variant="h2" gutterBottom>
                    Welcome to ADEPI
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph>
                    Your ADEPI homepage
                </Typography>
                <Button
                    component={Link}
                    to="/auth/login"
                    variant="contained"
                    size="large"
                >
                    Get Started
                </Button>
            </Box>
        </MainLayout>
    )
}
