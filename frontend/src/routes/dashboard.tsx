
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Container, Paper, Typography, Box, Button, Stack, Chip } from "@mui/material";
import { useState } from "react";
import { useAuthUser, useLogout } from "@/hooks/auth/auth-hooks";
import { useAuthStore } from "@/store/auth";
import { ChangePassword } from "@/components/features/auth";

export const Route = createFileRoute("/dashboard")({
    beforeLoad: async () => {
        const store = useAuthStore.getState();
        const token = store.getAccessToken();
        if (!token) {
            throw redirect({ to: "/" });
        }
    },
    component: DashboardPage,
});

function DashboardPage() {
    const navigate = useNavigate();
    const { data: user, isLoading, isError } = useAuthUser();
    const logoutMutation = useLogout();
    const [showPasswordChange, setShowPasswordChange] = useState(false);

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
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography>Loading...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
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

                {showPasswordChange && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Change Password
                        </Typography>
                        <ChangePassword />
                    </Box>
                )}

                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                    {!showPasswordChange && (
                        <Button
                            variant="outlined"
                            onClick={() => setShowPasswordChange(true)}
                        >
                            Change Password
                        </Button>
                    )}
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
        </Container>
    );
}
