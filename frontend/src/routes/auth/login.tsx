import { LoginFeature } from '@/components/features/auth/Login'
import { MainLayout, CustomAppBar } from '@/components/layouts'
import Box from '@mui/material/Box'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/login')({
  component: RouteComponent,
})


function RouteComponent() {
  return (
    <MainLayout>
      <CustomAppBar pageHeader="Login">
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <LoginFeature/>
        </Box>
      </CustomAppBar>
    </MainLayout>
  )
}