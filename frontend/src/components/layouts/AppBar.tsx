import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Settings from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import Logout from '@mui/icons-material/Logout';

import { Menu } from './Menu';
import type { MenuCategory } from './Menu';

export interface AppBarProps {
  logo: React.ReactNode;
  pageHeader: string;
  // optional callback when menu icon is clicked
  onMenuClick?: () => void;
}

export const CustomAppBar: React.FC<AppBarProps> = ({
  logo,
  pageHeader,
  onMenuClick
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuOpen = () => {
    setMenuOpen(true);
    onMenuClick?.();
  };

  const categories: MenuCategory[] = [
    {
      category: 'General',
      links: [
        { label: 'Home', icon: <HomeIcon />, onClick: () => console.log('Home') },
        { label: 'Profile', icon: <AccountCircle />, onClick: () => console.log('Profile') },
      ],
    },
    {
      category: 'Settings',
      links: [
        { label: 'Preferences', icon: <Settings />, onClick: () => console.log('Preferences') },
        { label: 'Sign out', icon: <Logout />, onClick: () => console.log('Sign out') },
      ],
    },
  ];

  return (
    <>
      <AppBar position="fixed" elevation={2}>
        <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
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
            onClick={handleMenuOpen}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        appBarHeight={64}
        title="Menu"
        categories={categories}
      />
    </>
  );
};