import { Login } from '@/components/features/auth'
import { MainLayout } from '@/components/layouts'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth/auth-store';
import { URLS } from '@/constants/urls';

export const Route = createFileRoute("/auth/login")({
    beforeLoad: async () => {
        const store = useAuthStore.getState();
        const token = store.getAccessToken();
        if (token) {
            throw redirect({ to: URLS.DASHBOARD });
        }
    },
    component: LoginPage,
});

function LoginPage() {
    return (
        <MainLayout isBarHidden>
                <Login />
        </MainLayout>
    )
}