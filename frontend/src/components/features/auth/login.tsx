import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Box, TextField, Button, Typography, Alert } from '@mui/material'
import { useLogin } from '@/hooks/auth-hooks'

export const Login: React.FC = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const loginMutation = useLogin()

    // Handle successful login
    useEffect(() => {
        if (loginMutation.isSuccess && loginMutation.data) {
            const { isPasswordResetRequired } = loginMutation.data

            if (isPasswordResetRequired) {
                navigate({ to: '/auth/change-password' })
            } else {
                navigate({ to: '/dashboard' })
            }
        }
    }, [loginMutation.isSuccess, loginMutation.data, navigate])

    const handleLogin = () => {
        if (!email || !password) {
            alert('Please enter both email and password')
            return
        }

        loginMutation.mutate({
            email,
            password,
        })
    }

    const isLoading = loginMutation.isPending
    const hasError = loginMutation.isError

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '360px',
                aspectRatio: '9/16',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 3,
            }}
        >
            <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
                Sign In
            </Typography>

            {hasError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {loginMutation.error?.message || 'Login failed. Please try again.'}
                </Alert>
            )}

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', textAlign: 'left' }}>
                    Email
                </Typography>
                <TextField
                    fullWidth
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={isLoading}
                />
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', textAlign: 'left' }}>
                    Password
                </Typography>
                <TextField
                    fullWidth
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                />
            </Box>

            <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleLogin}
                disabled={isLoading || !email || !password}
                sx={{ mb: 2 }}
            >
                {isLoading ? 'Logging in...' : 'Login'}
            </Button>
        </Box>
    )
}
