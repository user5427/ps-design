import { Box, AppBar as MUIAppBar, Toolbar, Typography } from "@mui/material";
import type React from "react";

interface LogoProps {
  logo: {
    image: React.ReactNode;
    text?: string;
  };
  logoText?: string;
  size?: number;
}

export interface AppBarProps extends LogoProps {}

const Logo: React.FC<LogoProps> = ({ logo, size = 40 }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      {logo.image}
    </Box>

    {logo.text && (
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {logo.text}
      </Typography>
    )}
  </Box>
);

export const AppBar: React.FC<AppBarProps> = ({ logo, logoText }) => {
  if (!logo) return null;

  return (
    <MUIAppBar
      position="absolute"
      elevation={1}
      sx={{
        color: "text.primary",
        bgcolor: "background.paper",
        width: "100%",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Logo logo={logo} logoText={logoText} />
      </Toolbar>
    </MUIAppBar>
  );
};
