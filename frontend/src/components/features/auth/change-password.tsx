import { Box, Button, TextField, Typography } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  PasswordRequirements,
  PasswordStrengthIndicator,
} from "@/components/elements/auth";
import { FormAlert } from "@/components/elements/form";
import { useChangePassword } from "@/queries/auth";
import { checkPasswordStrength } from "@/utils/auth";
import { getReadableError } from "@/utils/get-readable-error";

export const ChangePassword: React.FC = () => {
  const [passwordStrength, setPasswordStrength] = useState(
    checkPasswordStrength(""),
  );
  const changePasswordMutation = useChangePassword();

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (value.newPassword !== value.confirmPassword) {
        return;
      }
      if (!passwordStrength.isValid) {
        return;
      }
      changePasswordMutation.mutate(
        {
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        },
        {
          onSuccess: () => {
            form.reset();
            setPasswordStrength(checkPasswordStrength(""));
          },
        },
      );
    },
  });

  const confirmPwdValue = form.getFieldValue("confirmPassword");
  const newPwdValue = form.getFieldValue("newPassword");
  const passwordsMatch =
    newPwdValue === confirmPwdValue && newPwdValue.length > 0;
  const isFormValid =
    form.getFieldValue("currentPassword").length > 0 &&
    newPwdValue.length > 0 &&
    confirmPwdValue.length > 0 &&
    passwordsMatch &&
    passwordStrength.isValid;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "360px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        px: 3,
        py: 3,
      }}
    >
      <Typography variant="h4" sx={{ mb: 4, textAlign: "center" }}>
        Change Password
      </Typography>

      {changePasswordMutation.isError && (
        <FormAlert
          message={getReadableError(
            changePasswordMutation.error,
            "Failed to change password",
          )}
        />
      )}

      {changePasswordMutation.isSuccess && (
        <FormAlert
          message="Password changed successfully!"
          severity="success"
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="currentPassword"
          children={(field: any) => (
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={!!field.state.meta.errors.length}
              helperText={field.state.meta.errors[0]}
              placeholder="Enter your current password"
              disabled={changePasswordMutation.isPending}
              margin="normal"
            />
          )}
        />
        <form.Field
          name="newPassword"
          children={(field: any) => (
            <>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  setPasswordStrength(
                    checkPasswordStrength(e.target.value),
                  );
                }}
                onBlur={field.handleBlur}
                error={!!field.state.meta.errors.length}
                helperText={field.state.meta.errors[0]}
                placeholder="Enter your new password"
                disabled={changePasswordMutation.isPending}
                margin="normal"
              />
              {field.state.value.length > 0 && (
                <PasswordStrengthIndicator
                  score={passwordStrength.score}
                  feedback={passwordStrength.feedback}
                />
              )}
            </>
          )}
        />
        <form.Field
          name="confirmPassword"
          children={(field: any) => (
            <>
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={!!field.state.meta.errors.length}
                helperText={field.state.meta.errors[0]}
                placeholder="Confirm your new password"
                disabled={changePasswordMutation.isPending}
                margin="normal"
              />
              {field.state.value.length > 0 && !passwordsMatch && (
                <FormAlert message="Passwords do not match" sx={{ mb: 4 }} />
              )}
            </>
          )}
        />
        {!passwordStrength.isValid && newPwdValue.length > 0 && (
          <FormAlert
            message={
              <PasswordRequirements
                feedback={passwordStrength.feedback}
              />
            }
            sx={{ mb: 4 }}
          />
        )}
        <Button
          fullWidth
          variant="contained"
          size="large"
          type="submit"
          disabled={!isFormValid || changePasswordMutation.isPending}
          sx={{
            opacity: isFormValid ? 1 : 0.5,
            mt: 2,
          }}
        >
          {changePasswordMutation.isPending
            ? "Changing Password..."
            : "Change Password"}
        </Button>
      </form>
    </Box>
  );
};
