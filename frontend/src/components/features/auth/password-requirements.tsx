import React from 'react';
import { Box, Typography } from '@mui/material';

interface PasswordRequirementsProps {
  feedback: string[];
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ feedback }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    Password does not meet requirements:
    {feedback.map((message: string, index: number) => (
      <Typography key={index} variant="caption">
        • {message}
      </Typography>
    ))}
  </Box>
);
