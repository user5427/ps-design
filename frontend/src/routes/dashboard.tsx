import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Stack,
    Chip,
} from "@mui/material";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard")({
    beforeLoad: async () => {
        const store = useAuthStore.getState()
        const token = store.getAccessToken()
        if (!token) {
            throw redirect({ to: "/" });
        }
        try {
            const response = await fetch("/api/auth/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });
            if (!response.ok) {
                throw redirect({ to: "/" });
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('redirect')) {
                throw error
            }
            throw redirect({ to: "/" });
        }
    },
    component: Dashboard,
});

function Dashboard() {
    const { user, logout, fetchCurrentUser, isLoading } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            fetchCurrentUser().catch(() => {
                navigate({ to: "/" });
            });
        }
    }, [user, fetchCurrentUser, navigate]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate({ to: "/" });
        } catch (error) {
            console.error("Logout error:", error);
        }
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
                            User ID
                        </Typography>
                        <Typography variant="body1">{user.userId}</Typography>
                    </Box>

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

                    {user.isPasswordResetRequired && (
                        <Box>
                            <Chip
                                label="Password reset required"
                                color="warning"
                                size="small"
                            />
                        </Box>
                    )}
                </Stack>

                <Box sx={{ mt: 4 }}>
                    <Button variant="contained" color="error" onClick={handleLogout}>
                        Logout
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
