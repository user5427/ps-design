import React from 'react';
import { Link } from '@tanstack/react-router';
import { Link as MuiLink } from '@mui/material';
import { Typography, Box, List, ListItem, ListItemIcon, ListItemText, Divider, Collapse } from '@mui/material';

interface MenuItemData {
    label: string;
    icon?: React.ReactNode;
    to: string;
}

interface MenuCategory {
    category: string;
    links: MenuItemData[];
}

export interface MenuProps {
    categories: MenuCategory[];
    open?: boolean;
    onClose?: () => void;
    appBarHeight?: number;
}

export const Menu: React.FC<MenuProps> = ({
    categories,
    open,
    onClose,
    appBarHeight = 64
}) => {
    if (!open || !onClose || !categories)
        return null;

    return (
        <Collapse in={open} timeout={300}>
            <Box
                sx={{
                    position: 'absolute',
                    top: `${appBarHeight}px`,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1200,
                    overflow: 'auto',
                    boxShadow: 3,
                }}
                onClick={onClose}
            >
                <List sx={{ pt: 2 }}>
                    {categories.map((cat, catIndex) => (
                        <Box key={catIndex}>
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
                                        <MuiLink
                                            component={Link}
                                            to={link.to}
                                            onClick={onClose}
                                            sx={{
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                py: 1.25,
                                                px: 3,
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                },
                                            }}
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
                                        </MuiLink>
                                    </ListItem>
                                    {idx < cat.links.length - 1 && (
                                        <Divider component="li" sx={{ mx: 3 }} />
                                    )}
                                </React.Fragment>
                            ))}
                            {catIndex < categories.length - 1 && (
                                <Divider sx={{ my: 2 }} />
                            )}
                        </Box>
                    ))}
                </List>
            </Box>
        </Collapse>
    );
};