import { Register } from '@/components/features/auth'
import { MainLayout } from '@/components/layouts/main-layout'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth';
import { URLS } from '@/constants/urls';

export const Route = createFileRoute("/auth/register")({
    beforeLoad: async () => {
        const store = useAuthStore.getState();
        const token = store.getAccessToken();
        if (token) {
            throw redirect({ to: URLS.DASHBOARD });
        }
    },
    component: RegisterPage,
});

function RegisterPage() {
    return (
        <MainLayout isBarHidden>
                <Register />
        </MainLayout>
    )
}
