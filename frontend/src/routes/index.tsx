import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Container, Typography, Stack } from "@mui/material";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../lib/api";
import { LoginForm } from "../components/LoginForm";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    const token = store.getAccessToken();
    if (token) {
      try {
        await authApi.getCurrentUser();
        throw redirect({ to: "/dashboard" });
      } catch (error) {
        if (error instanceof Error && error.message?.includes("redirect")) {
          throw error;
        }
      }
    }
  },
  component: App,
});

function App() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => navigate({ to: "/dashboard" });

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Sign In</Typography>
        <LoginForm
          onSuccess={handleLoginSuccess}
        />
      </Stack>
    </Container>
  );
}
