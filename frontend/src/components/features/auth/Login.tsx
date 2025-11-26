import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Box, TextField, Button, Typography, Link as MuiLink } from '@mui/material';

export const LoginFeature: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        console.log('Login:', { username, password });
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
                Welcome Back
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', textAlign: 'left' }}>
                    Username
                </Typography>
                <TextField
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
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
                />
            </Box>

            <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleLogin}
                sx={{ mb: 2 }}
            >
                Login
            </Button>

            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                New to our services?{' '}
                <MuiLink component={Link} to="/auth/register" sx={{ fontWeight: 500 }}>
                    Register
                </MuiLink>
            </Typography>
        </Box>
    );
};
