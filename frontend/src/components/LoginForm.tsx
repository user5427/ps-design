import { useState } from "react";
import { Stack, TextField, Button, Alert } from "@mui/material";
import { useLogin } from "../hooks/useAuthHooks";

interface LoginFormProps {
    onSuccess: (isPasswordResetRequired: boolean) => void;
    onPasswordForReset?: (password: string) => void;
}

export function LoginForm({ onSuccess, onPasswordForReset }: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const loginMutation = useLogin();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await loginMutation.mutateAsync({ email, password });
            if (result.isPasswordResetRequired && onPasswordForReset) {
                onPasswordForReset(password);
            }
            onSuccess(result.isPasswordResetRequired);
        } catch (err) {
            console.error("Login error:", err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    required
                />
                <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    required
                />
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loginMutation.isPending}
                >
                    {loginMutation.isPending ? "Logging in…" : "Login"}
                </Button>
                {loginMutation.error && (
                    <Alert severity="error">{loginMutation.error.message}</Alert>
                )}
            </Stack>
        </form>
    );
}
