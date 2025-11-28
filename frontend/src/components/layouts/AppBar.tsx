import React, { useState } from 'react';
import { AppBar as MUIAppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import { Menu } from './Menu';
import type { MenuProps } from './Menu';

export interface AppBarProps {
    logo: React.ReactNode;
    pageHeader: string;
    menuProps: MenuProps;
}

export const AppBar: React.FC<AppBarProps> = ({
    logo,
    pageHeader,
    menuProps,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleMenuToggle = () => {
        setMenuOpen((prev) => {
            const next = !prev;
            return next;
        });
    };

    return (
        <>
            <MUIAppBar position="absolute" elevation={1} sx={{ color: 'text.primary', bgcolor: 'background.paper' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    {/* Logo - Left */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {logo}
                    </Box>

                    {/* Page Header - Center */}
                    <Typography
                        variant="h6"
                        component="h1"
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontWeight: 600,
                            textAlign: 'center'
                        }}
                    >
                        {pageHeader}
                    </Typography>

                    {/* Menu Icon - Right */}

                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={handleMenuToggle}
                        aria-label={menuOpen ? 'close menu' : 'open menu'}
                    >
                        {menuOpen ? <CloseIcon /> : <MenuIcon />}
                    </IconButton>
                </Toolbar>
            </MUIAppBar>


            <Menu {...menuProps} open={menuOpen} onClose={handleMenuToggle} />
        </>
    );
};