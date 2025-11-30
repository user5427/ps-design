import { createFileRoute, redirect, useNavigate, isRedirect } from "@tanstack/react-router";
import { Container, Typography, Stack } from "@mui/material";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../lib/api";
import { LoginForm } from "../components/LoginForm";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const store = useAuthStore.getState();
    let token = store.getAccessToken();

    // If no token in memory, try to refresh from cookie
    if (!token) {
      try {
        const { accessToken } = await authApi.refreshToken();
        store.setAccessToken(accessToken);
        token = accessToken;
      } catch {
        return;
      }
    }

    // If we have a token, verify and redirect to dashboard
    if (token) {
      try {
        await authApi.getCurrentUser();
        throw redirect({ to: "/dashboard" });
      } catch (error) {
        if (isRedirect(error)) {
          throw error;
        }
        // Token invalid, clear it
        // store.setAccessToken(null);
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
        <LoginForm onSuccess={handleLoginSuccess} />
      </Stack>
    </Container>
  );
}

