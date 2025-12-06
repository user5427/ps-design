import React, { useState } from 'react'
import { Box, TextField, Button, Typography } from '@mui/material'
import { checkPasswordStrength } from '@/utils/auth'
import { useChangePassword } from '@/queries/auth'
import { PasswordStrengthIndicator } from './password-strength-indicator'
import { PasswordRequirements } from './password-requirements'
import { FormAlert } from './form-alert'

export const ChangePassword: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordStrength, setPasswordStrength] = useState(checkPasswordStrength(''))

    const changePasswordMutation = useChangePassword()

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setNewPassword(value)
        setPasswordStrength(checkPasswordStrength(value))
    }

    const handleSubmit = () => {
        if (newPassword !== confirmPassword) {
            return
        }
        if (!passwordStrength.isValid) {
            return
        }
        changePasswordMutation.mutate({
            currentPassword,
            newPassword,
        })
    }

    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0
    const isFormValid =
        currentPassword.length > 0 &&
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        passwordsMatch &&
        passwordStrength.isValid

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '360px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 3,
                py: 3,
            }}
        >
            <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
                Change Password
            </Typography>

            {changePasswordMutation.isError && (
                <FormAlert message={changePasswordMutation.error?.message || 'Failed to change password'} />
            )}

            {changePasswordMutation.isSuccess && (
                <FormAlert message="Password changed successfully!" severity="success" />
            )}

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', textAlign: 'left' }}>
                    Current Password
                </Typography>
                <TextField
                    fullWidth
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    disabled={changePasswordMutation.isPending}
                />
            </Box>

            <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', textAlign: 'left' }}>
                    New Password
                </Typography>
                <TextField
                    fullWidth
                    type="password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    placeholder="Enter your new password"
                    disabled={changePasswordMutation.isPending}
                />
            </Box>

            {newPassword.length > 0 && (
                <PasswordStrengthIndicator score={passwordStrength.score} feedback={passwordStrength.feedback} />
            )}

            <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', textAlign: 'left' }}>
                    Confirm Password
                </Typography>
                <TextField
                    fullWidth
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    error={confirmPassword.length > 0 && !passwordsMatch}
                    helperText={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : ''}
                    disabled={changePasswordMutation.isPending}
                />
            </Box>

            {confirmPassword.length > 0 && !passwordsMatch && (
                <FormAlert message="Passwords do not match" sx={{ mb: 4 }} />
            )}

            {!passwordStrength.isValid && newPassword.length > 0 && (
                <FormAlert message={<PasswordRequirements feedback={passwordStrength.feedback} />} sx={{ mb: 4 }} />
            )}

            <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={!isFormValid || changePasswordMutation.isPending}
                sx={{
                    opacity: isFormValid ? 1 : 0.5,
                }}
            >
                {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
            </Button>
        </Box>
    )
}
