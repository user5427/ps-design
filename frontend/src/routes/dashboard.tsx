import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Paper, Typography, Box, Button, Stack, Chip } from "@mui/material";
import { useAuthUser, useLogout } from "@/hooks/auth/auth-hooks";
import { useAuthStore } from "@/store/auth";
import { MainLayout } from '@/components/layouts/main-layout';
import { URLS } from "@/constants/urls";

export const Route = createFileRoute("/dashboard")({
    beforeLoad: async () => {
        const store = useAuthStore.getState();
        const token = store.getAccessToken();
        if (!token) {
            throw redirect({ to: URLS.HOME });
        }
    },
    component: DashboardPage,
});

function DashboardPage() {
    const navigate = useNavigate();
    const { data: user, isLoading, isError } = useAuthUser();
    const logoutMutation = useLogout();

    if (isError) {
        navigate({ to: "/" });
        return null;
    }

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
        } catch (error) {
            console.error("Logout error:", error);
        }
        navigate({ to: "/" });
    };

    if (isLoading || !user) {
        return (
            <MainLayout>
                    <Typography>Loading...</Typography>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
                <Paper sx={{ p: 4, width: '100%', maxWidth: 600 }}>
                    <Typography variant="h4" gutterBottom>
                        Dashboard
                    </Typography>

                    <Stack spacing={2} sx={{ mt: 3 }}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Email
                            </Typography>
                            <Typography variant="body1">{user.email}</Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Role
                            </Typography>
                            <Chip label={user.role} color="primary" size="small" />
                        </Box>

                        {user.businessId && (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Business ID
                                </Typography>
                                <Typography variant="body1">{user.businessId}</Typography>
                            </Box>
                        )}
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate({ to: URLS.CHANGE_PASSWORD })}
                        >
                            Change Password
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleLogout}
                            disabled={logoutMutation.isPending}
                        >
                            {logoutMutation.isPending ? "Logging out..." : "Logout"}
                        </Button>
                    </Stack>
                </Paper>
        </MainLayout>
    );
}
