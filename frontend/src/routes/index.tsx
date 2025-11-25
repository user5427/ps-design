import { createFileRoute } from '@tanstack/react-router'
import { Box, Typography, Button } from '@mui/material'
import { Link } from '@tanstack/react-router'
import { MainLayout } from '@/components/layouts/MainLayout'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <MainLayout>
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h2" gutterBottom>
          Welcome to PS Design 2025
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Your application homepage
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