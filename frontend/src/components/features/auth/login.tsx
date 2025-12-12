import { Button, TextField } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { AuthFormLayout } from "@/components/elements/auth";
import { FormAlert } from "@/components/elements/form";
import { URLS } from "@/constants/urls";
import { useLogin } from "@/hooks/auth/auth-hooks";
import { getReadableError } from "@/utils/get-readable-error";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      loginMutation.mutate({
        email: value.email,
        password: value.password,
      });
    },
  });

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

  return (
    <AuthFormLayout title="Sign In">
      {loginMutation.isError && (
        <FormAlert
          message={getReadableError(
            loginMutation.error,
            "Incorrect credentials. Please try again.",
          )}
        />
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field: any) => (
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={!!field.state.meta.errors.length}
              helperText={field.state.meta.errors[0]}
              placeholder="Enter your email"
              disabled={loginMutation.isPending}
              margin="normal"
            />
          )}
        </form.Field>
        <form.Field name="password">
          {(field: any) => (
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={!!field.state.meta.errors.length}
              helperText={field.state.meta.errors[0]}
              placeholder="Enter your password"
              disabled={loginMutation.isPending}
              margin="normal"
            />
          )}
        </form.Field>
        <Button
          fullWidth
          variant="contained"
          size="large"
          type="submit"
          disabled={loginMutation.isPending}
          sx={{ mb: 2, mt: 2 }}
        >
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </Button>
      </form>
    </AuthFormLayout>
  );
};
