import { createFileRoute } from "@tanstack/react-router";
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
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetRequired, setResetRequired] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    setInfo(null);
    setResetRequired(false);
    try {
      const basic = btoa(`${email}:${password}`);
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { Authorization: `Basic ${basic}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Login failed");
      }
      if (data.isPasswordResetRequired) {
        setInfo("Password reset required. Please change your password.");
        setResetRequired(true);
      } else {
        setInfo("Login successful.");
        console.log("Logged in user data:", data);
      }
    } catch (e: any) {
      setError(e.message || "Login error");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    setChanging(true);
    setChangeError(null);
    try {
      if (!newPassword || newPassword.length < 3) {
        throw new Error("New password must be at least 3 characters");
      }
      if (newPassword !== newPassword2) {
        throw new Error("Passwords do not match");
      }
      const basic = btoa(`${email}:${password}`);
      const res = await fetch("/auth/change-password", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as any)?.error || "Failed to change password");
      }
      setInfo("Password changed. Please log in with your new password.");
      setResetRequired(false);
      setNewPassword("");
      setNewPassword2("");
      setPassword("");
    } catch (e: any) {
      setChangeError(e.message || "Password change failed");
    } finally {
      setChanging(false);
    }
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
          />
          <Button
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={handleLogin}
            sx={{ mt: 2 }}
          >
            {loading ? "Logging in…" : "Login"}
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {info && (
          <Alert severity={info.includes("required") ? "warning" : "success"}>
            {info}
          </Alert>
        )}
        {resetRequired && (
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
                disabled={changing}
                onClick={handleChangePassword}
              >
                {changing ? "Changing…" : "Change Password"}
              </Button>
              {changeError && <Alert severity="error">{changeError}</Alert>}
            </Stack>
          </Box>
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
