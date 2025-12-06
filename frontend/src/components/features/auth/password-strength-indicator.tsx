import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { getPasswordStrengthColor, getPasswordStrengthLabel } from '@/utils/auth';

interface PasswordStrengthIndicatorProps {
  score: 0 | 1 | 2 | 3;
  feedback: string[];
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  score,
  feedback,
}) => (
  <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Password Strength
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: getPasswordStrengthColor(score),
        }}
      >
        {getPasswordStrengthLabel(score)}
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={(score / 3) * 100}
      sx={{
        height: 6,
        borderRadius: 3,
        backgroundColor: '#e0e0e0',
        '& .MuiLinearProgress-bar': {
          backgroundColor: getPasswordStrengthColor(score),
          borderRadius: 3,
        },
      }}
    />
    {feedback.length > 0 && (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {feedback.map((message: string) => (
          <Typography
            key={message}
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
);
