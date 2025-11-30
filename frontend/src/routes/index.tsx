import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Container,
  Typography,
  Link as MuiLink,
  Stack,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { useAuthUser, useLogin, useRefreshToken, useChangePassword } from "../hooks/useAuthHooks";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../lib/api";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const store = useAuthStore.getState()
    const token = store.getAccessToken()
    if (token) {
      try {
        await authApi.getCurrentUser()
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const store = useAuthStore();
  const hasAttemptedRefresh = useRef(false);

  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [changeError, setChangeError] = useState<string | null>(null);

  // Hooks from React Query
  const { data: user, isLoading: isCheckingAuth } = useAuthUser();
  const loginMutation = useLogin();
  const refreshTokenMutation = useRefreshToken();
  const changePasswordMutation = useChangePassword();

  // Check if already authenticated and redirect or attempt refresh (only once)
  useEffect(() => {
    const checkAuthentication = async () => {
      const token = store.getAccessToken();

      if (token && user) {
        // Already authenticated
        navigate({ to: "/dashboard" });
        return;
      }

      if (!token && !hasAttemptedRefresh.current) {
        hasAttemptedRefresh.current = true;
        try {
          await refreshTokenMutation.mutateAsync();
          navigate({ to: "/dashboard" });
        } catch (error) {
          console.debug("No valid session, showing login form");
        }
      }
    };

    checkAuthentication();
  }, [user, navigate, store, refreshTokenMutation]);

  async function handleLogin() {
    try {
      const result = await loginMutation.mutateAsync({ email, password });

      if (result.isPasswordResetRequired) {
        // Stay on page, show password change form
        return;
      }

      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("Login error:", err);
    }
  }

  async function handleChangePassword() {
    setChangeError(null);
    try {
      if (!newPassword || newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters");
      }
      if (newPassword !== newPassword2) {
        throw new Error("Passwords do not match");
      }

      await changePasswordMutation.mutateAsync({
        currentPassword: password,
        newPassword,
      });

      setNewPassword("");
      setNewPassword2("");
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      setChangeError(e.message || "Password change failed");
    }
  }

  const isLoading = loginMutation.isPending || changePasswordMutation.isPending;
  const error = loginMutation.error?.message || "";
  const resetRequired = user?.isPasswordResetRequired;

  if (isCheckingAuth) {
    return (
      <Container
        maxWidth="sm"
        sx={{ backgroundColor: "#000", minHeight: "100vh" }}
      >
        <Stack spacing={3} sx={{ py: 6 }}>
          <Typography variant="h4" sx={{ color: "#fff", textAlign: "center" }}>
            Checking authentication…
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="sm"
      sx={{ backgroundColor: "#000", minHeight: "100vh" }}
    >
      <Stack spacing={3} sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ color: "#fff", textAlign: "center" }}>
          Sign In
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            variant="filled"
            InputProps={{ sx: { backgroundColor: "#2b2b2b", color: "#fff" } }}
            InputLabelProps={{ sx: { color: "#bbb" } }}
            disabled={resetRequired}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            variant="filled"
            InputProps={{ sx: { backgroundColor: "#2b2b2b", color: "#fff" } }}
            InputLabelProps={{ sx: { color: "#bbb" } }}
            disabled={resetRequired}
          />
          <Button
            variant="contained"
            color="primary"
            disabled={isLoading || resetRequired}
            onClick={handleLogin}
            sx={{ mt: 2 }}
          >
            {isLoading ? "Logging in…" : "Login"}
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {resetRequired && (
          <>
            <Alert severity="warning">
              Password reset required. Please change your password.
            </Alert>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                Change Password
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                  variant="filled"
                  InputProps={{
                    sx: { backgroundColor: "#2b2b2b", color: "#fff" },
                  }}
                  InputLabelProps={{ sx: { color: "#bbb" } }}
                  helperText="At least 8 characters"
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  fullWidth
                  variant="filled"
                  InputProps={{
                    sx: { backgroundColor: "#2b2b2b", color: "#fff" },
                  }}
                  InputLabelProps={{ sx: { color: "#bbb" } }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={isLoading}
                  onClick={handleChangePassword}
                >
                  {isLoading ? "Changing…" : "Change Password"}
                </Button>
                {changeError && <Alert severity="error">{changeError}</Alert>}
              </Stack>
            </Box>
          </>
        )}
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <MuiLink href="#" sx={{ color: "#8ab4f8" }}>
            Forgot password?
          </MuiLink>
        </Box>
      </Stack>
    </Container>
  );
}
