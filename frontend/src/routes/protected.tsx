import { createFileRoute, redirect } from "@tanstack/react-router";
import { Container, Paper, Typography, Box, Button } from "@mui/material";
import { useState } from "react";
import { authenticatedFetch } from "../lib/authenticatedFetch";
import { useAuthStore } from "../store/authStore";

export const Route = createFileRoute("/protected")({
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
    component: ProtectedExample,
});

function ProtectedExample() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProtectedData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await authenticatedFetch("/api/auth/me");

            if (!response.ok) {
                throw new Error("Failed to fetch protected data");
            }

            const result = await response.json();
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Protected Route Example
                </Typography>

                <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                    This page demonstrates a protected route that requires authentication.
                    The <code>authenticatedFetch</code> wrapper automatically refreshes
                    tokens when a 401 is received.
                </Typography>

                <Box>
                    <Button
                        variant="contained"
                        onClick={fetchProtectedData}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Fetch Protected Data"}
                    </Button>

                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            Error: {error}
                        </Typography>
                    )}

                    {data && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6">Response:</Typography>
                            <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px" }}>
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}
