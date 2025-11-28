import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

const MainLayout = ({ children }: { children?: React.ReactNode }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                bgcolor: '#f5f5f5',
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: isMobile ? '100%' : 'calc(100vh * 9 / 16)',
                    height: '100vh',
                    bgcolor: 'white',
                    boxShadow: isMobile ? 'none' : '0 0 20px rgba(0,0,0,0.1)',
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export { MainLayout };