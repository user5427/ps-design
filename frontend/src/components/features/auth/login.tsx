import { Button } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useState } from "react";
import { URLS } from "@/constants/urls";
import { useLogin } from "@/hooks/auth/auth-hooks";
import { getReadableError } from "@/utils/get-readable-error";
import { FormAlert, FormField } from "@/components/elements/form";
import { AuthFormLayout } from "@/components/elements/auth";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const navigate = useNavigate();
  const loginMutation = useLogin();

  useEffect(() => {
    if (loginMutation.isSuccess && loginMutation.data) {
      const { isPasswordResetRequired } = loginMutation.data;
      if (isPasswordResetRequired) {
        navigate({ to: URLS.CHANGE_PASSWORD });
      } else {
        navigate({ to: URLS.DASHBOARD });
      }
    }
  }, [loginMutation.isSuccess, loginMutation.data, navigate]);

  const handleLogin = () => {
    if (!email || !password) {
      setValidationError("Please enter both email and password");
      return;
    }
    setValidationError("");
    loginMutation.mutate({ email, password });
  };

  const isLoading = loginMutation.isPending;
  const hasError = loginMutation.isError;

  return (
    <AuthFormLayout title="Sign In">
      {validationError && <FormAlert message={validationError} />}
      {hasError && (
        <FormAlert
          message={getReadableError(
            loginMutation.error,
            "Incorrect credentials. Please try again.",
          )}
        />
      )}
      <FormField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        disabled={isLoading}
      />
      <FormField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        disabled={isLoading}
        sx={{ mb: 4 }}
      />
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleLogin}
        disabled={isLoading || !email || !password}
        sx={{ mb: 2 }}
      >
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </AuthFormLayout>
  );
};
