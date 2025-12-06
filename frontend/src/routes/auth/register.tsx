import { Register } from '@/components/features/auth'
import { MainLayout } from '@/components/layouts/main-layout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/register')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <MainLayout isBarHidden>
                <Register />
        </MainLayout>
    )
}
