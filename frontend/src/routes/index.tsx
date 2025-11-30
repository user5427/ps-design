import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Container, Typography, Stack, Alert } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { useAuthUser, useRefreshToken } from "../hooks/useAuthHooks";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../lib/api";
import { LoginForm } from "../components/LoginForm";
import { PasswordChangeForm } from "../components/PasswordChangeForm";

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
  const store = useAuthStore();
  const hasAttemptedRefresh = useRef(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");

  const { data: user, isLoading: isCheckingAuth } = useAuthUser();
  const refreshTokenMutation = useRefreshToken();

  useEffect(() => {
    const checkAuth = async () => {
      if (store.getAccessToken() && user) {
        navigate({ to: "/dashboard" });
        return;
      }

      if (!store.getAccessToken() && !hasAttemptedRefresh.current) {
        hasAttemptedRefresh.current = true;
        try {
          await refreshTokenMutation.mutateAsync();
          navigate({ to: "/dashboard" });
        } catch {
          // No valid session
        }
      }
    };
    checkAuth();
  }, [user, navigate, store, refreshTokenMutation]);

  const handleLoginSuccess = (isPasswordResetRequired: boolean) => {
    if (isPasswordResetRequired) {
      setShowPasswordReset(true);
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  const handlePasswordChanged = () => {
    navigate({ to: "/dashboard" });
  };

  if (isCheckingAuth) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Typography>Checking authentication…</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Sign In</Typography>

        {!showPasswordReset ? (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onPasswordForReset={setLoginPassword}
          />
        ) : (
          <>
            <Alert severity="warning">
              Password reset required. Please change your password.
            </Alert>
            <PasswordChangeForm
              currentPassword={loginPassword}
              onSuccess={handlePasswordChanged}
            />
          </>
        )}
      </Stack>
    </Container>
  );
}
