import React, { useState } from 'react'
import { Box, TextField, Button, Typography, LinearProgress, Alert } from '@mui/material'
import { checkPasswordStrength, getPasswordStrengthColor, getPasswordStrengthLabel } from '@/utils/auth'
import { useChangePassword } from '@/queries/auth'

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
        // Validate passwords match
        if (newPassword !== confirmPassword) {
            return
        }

        // Validate password strength
        if (!passwordStrength.isValid) {
            return
        }

        // Submit change password request
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

            {/* Error messages */}
            {changePasswordMutation.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {changePasswordMutation.error?.message || 'Failed to change password'}
                </Alert>
            )}

            {changePasswordMutation.isSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Password changed successfully!
                </Alert>
            )}

            {/* Current Password */}
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

            {/* New Password */}
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

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
                <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Password Strength
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 600,
                                color: getPasswordStrengthColor(passwordStrength.score),
                            }}
                        >
                            {getPasswordStrengthLabel(passwordStrength.score)}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={(passwordStrength.score / 3) * 100}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                                borderRadius: 3,
                            },
                        }}
                    />
                    {passwordStrength.feedback.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {passwordStrength.feedback.map((message: string, index: number) => (
                                <Typography
                                    key={index}
                                    variant="caption"
                                    sx={{
                                        color: '#d32f2f',
                                        display: 'flex',
                                        alignItems: 'center',
                                        '&:before': {
                                            content: '"• "',
                                            marginRight: '4px',
                                        },
                                    }}
                                >
                                    {message}
                                </Typography>
                            ))}
                        </Box>
                    )}
                </Box>
            )}

            {/* Confirm Password */}
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
                <Alert severity="error" sx={{ mb: 4 }}>
                    Passwords do not match
                </Alert>
            )}

            {!passwordStrength.isValid && newPassword.length > 0 && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        Password does not meet requirements:
                        {passwordStrength.feedback.map((message: string, index: number) => (
                            <Typography key={index} variant="caption">
                                • {message}
                            </Typography>
                        ))}
                    </Box>
                </Alert>
            )}

            {/* Submit Button */}
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
