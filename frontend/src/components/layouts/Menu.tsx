import React from 'react';
import { Typography, IconButton, Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface MenuItemData {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface MenuCategory {
  category: string;
  links: MenuItemData[];
}

interface MenuProps {
  // Grouped categories to render in the menu
  categories: MenuCategory[];
  title?: string;
  // Controlled props: parent must provide open and onClose
  open: boolean;
  onClose: () => void;
  // Height of the AppBar to offset the drawer (e.g. '64px' or 64). Defaults to '64px'.
  appBarHeight?: number | string;
}

export const Menu: React.FC<MenuProps> = ({ categories, title = 'Menu', open, onClose, appBarHeight = '64px' }) => {
  const handleMenuClose = () => {
    onClose();
  };

  // Normalize into categories for rendering
  const normalized: MenuCategory[] = categories;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleMenuClose}
      PaperProps={{
        sx: {
          width: '100%',
          // Fill the viewport below the app bar
          position: 'fixed',
          top: typeof appBarHeight === 'number' ? `${appBarHeight}px` : appBarHeight,
          height: `calc(100% - ${typeof appBarHeight === 'number' ? `${appBarHeight}px` : appBarHeight})`,
          maxWidth: '360px'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Menu Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <IconButton onClick={handleMenuClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Categories */}
        <List sx={{ flex: 1, pt: 1 }}>
          {normalized.map((cat, catIndex) => (
            <Box key={catIndex} sx={{ width: '100%' }}>
              {cat.category && (
                <Box sx={{ px: 3, pt: 2, pb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {cat.category}
                  </Typography>
                </Box>
              )}

              {cat.links.map((link, idx) => (
                <React.Fragment key={idx}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        link.onClick();
                        handleMenuClose();
                      }}
                      sx={{ py: 1.25, px: 3 }}
                    >
                      {link.icon && (
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {link.icon}
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={link.label}
                        primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
                      />
                    </ListItemButton>
                  </ListItem>

                  {/* Separator between links */}
                  {idx < cat.links.length - 1 && (
                    <Divider component="li" sx={{ mx: 3 }} />
                  )}
                </React.Fragment>
              ))}

              {/* Divider between categories */}
              {catIndex < normalized.length - 1 && (
                <Divider sx={{ my: 2 }} />
              )}
            </Box>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};