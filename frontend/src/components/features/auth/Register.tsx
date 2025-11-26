import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Box, TextField, Button, Typography, Link as MuiLink } from '@mui/material';


export const RegisterFeature: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = () => {
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        console.log('Register:', { username, password });
    };

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
                px: 3
            }}
        >
            <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
                Create Account
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', textAlign: 'left' }}>
                    Username
                </Typography>
                <TextField
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                />
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', textAlign: 'left' }}>
                    Password
                </Typography>
                <TextField
                    fullWidth
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                />
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', textAlign: 'left' }}>
                    Confirm Password
                </Typography>
                <TextField
                    fullWidth
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                />
            </Box>

            <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleRegister}
                sx={{ mb: 2 }}
            >
                Register
            </Button>

            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                Already have an account?{' '}
                <MuiLink component={Link} to="/auth/login" sx={{ fontWeight: 500 }}>
                    Login
                </MuiLink>
            </Typography>
        </Box>
    );
};