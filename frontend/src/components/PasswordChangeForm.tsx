import { useState } from "react";
import { Stack, TextField, Button, Alert } from "@mui/material";
import { useChangePassword } from "../hooks/useAuthHooks";

interface PasswordChangeFormProps {
    onSuccess: () => void;
    onCancel?: () => void;
}

export function PasswordChangeForm({ onSuccess, onCancel }: PasswordChangeFormProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const changePasswordMutation = useChangePassword();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Password change failed");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <TextField
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    fullWidth
                    required
                />
                <TextField
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    required
                    helperText="At least 8 characters"
                />
                <TextField
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    fullWidth
                    required
                />
                <Stack direction="row" spacing={2}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={changePasswordMutation.isPending}
                    >
                        {changePasswordMutation.isPending ? "Changing…" : "Change Password"}
                    </Button>
                    {onCancel && (
                        <Button variant="outlined" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                </Stack>
                {(error || changePasswordMutation.error) && (
                    <Alert severity="error">
                        {error || changePasswordMutation.error?.message}
                    </Alert>
                )}
            </Stack>
        </form>
    );
}
