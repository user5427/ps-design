import React from 'react';
import { Box } from '@mui/material';
import { AppBar } from '.';
import { AppBarData } from '@/constants';

interface MainLayoutProps {
    children?: React.ReactNode;
    isBarHidden?: boolean;
}

const MainLayout = ({ children, isBarHidden = false }: MainLayoutProps) => {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '100vh',
                minWidth: '100vw',
                bgcolor: '#f5f5f5',
            }}
        >
            {!isBarHidden && <AppBar {...AppBarData} />}
            <Box
                sx={{
                    width: '100%',
                    height: '100vh',
                    bgcolor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export { MainLayout };