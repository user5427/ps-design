import { Button } from "@mui/material";
import type React from "react";
import { useState } from "react";
import { URLS } from "@/constants/urls";
import { checkPasswordStrength } from "@/utils/auth";
import { AuthFormLayout } from "./auth-form-layout";
import { FormAlert } from "./form-alert";
import { FormField } from "./form-field";
import { PasswordRequirements } from "./password-requirements";
import { PasswordStrengthIndicator } from "./password-strength-indicator";

export const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(
    checkPasswordStrength(""),
  );

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  const handleRegister = () => {
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match!");
      return;
    }
    if (!passwordStrength.isValid) {
      setValidationError("Password does not meet requirements");
      return;
    }
    setValidationError("");
  };

  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isFormValid =
    email.length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    passwordsMatch &&
    passwordStrength.isValid;

  return (
    <AuthFormLayout
      title="Create Account"
      switchText="Already have an account?"
      switchLink={URLS.LOGIN}
      switchLinkText="Login"
    >
      {validationError && <FormAlert message={validationError} />}
      <FormField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <FormField
        label="Password"
        type="password"
        value={password}
        onChange={handlePasswordChange}
        placeholder="Create a password"
      />

      <FormField
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm your password"
        sx={{ mb: 1 }}
      />
      {confirmPassword.length > 0 && !passwordsMatch && (
        <FormAlert message="Passwords do not match" sx={{ mb: 4 }} />
      )}
      {password.length > 0 && (
        <PasswordStrengthIndicator
          score={passwordStrength.score}
          feedback={passwordStrength.feedback}
        />
      )}
      {!passwordStrength.isValid && password.length > 0 && (
        <FormAlert
          message={
            <PasswordRequirements feedback={passwordStrength.feedback} />
          }
          sx={{ mb: 4 }}
        />
      )}
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleRegister}
        disabled={!isFormValid}
        sx={{ mb: 2 }}
      >
        Register
      </Button>
    </AuthFormLayout>
  );
};
