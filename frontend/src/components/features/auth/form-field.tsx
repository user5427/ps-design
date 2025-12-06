import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

interface FormFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  sx?: object;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  sx = {},
}) => (
  <Box sx={{ mb: 3, ...sx }}>
    <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', textAlign: 'left' }}>
      {label}
    </Typography>
    <TextField
      fullWidth
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  </Box>
);
