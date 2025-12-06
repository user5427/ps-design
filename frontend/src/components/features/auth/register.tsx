import React, { useState } from 'react';
import { Button } from '@mui/material';
import { FormField } from './form-field';
import { FormAlert } from './form-alert';
import { AuthFormLayout } from './auth-form-layout';
import { URLS } from '@/constants/urls';

export const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validationError, setValidationError] = useState('');

    const handleRegister = () => {
        if (password !== confirmPassword) {
            setValidationError('Passwords do not match!');
            return;
        }
        setValidationError('');
    };

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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
            />
            <FormField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                sx={{ mb: 4 }}
            />
            <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleRegister}
                sx={{ mb: 2 }}
            >
                Register
            </Button>
        </AuthFormLayout>
    );
};