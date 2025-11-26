import { LoginFeature } from '@/components/features/auth/Login'
import { MainLayout } from '@/components/layouts/MainLayout'
import Box from '@mui/material/Box'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <MainLayout>
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <LoginFeature/>
      </Box>
    </MainLayout>
  )
}