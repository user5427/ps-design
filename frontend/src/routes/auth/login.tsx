import { Login } from '@/components/features/auth'
import { MainLayout } from '@/components/layouts'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth/auth-store';

export const Route = createFileRoute("/auth/login")({
    beforeLoad: async () => {
        const store = useAuthStore.getState();
        const token = store.getAccessToken();
        if (token) {
            throw redirect({ to: "/dashboard" });
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