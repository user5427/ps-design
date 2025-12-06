import { Box, AppBar as MUIAppBar, Toolbar, Typography } from "@mui/material";
import type React from "react";

interface LogoProps {
  image: React.ReactNode;
  logoText?: string;
  size?: number;
}

export interface AppBarProps {
    logo: LogoProps
}

const Logo: React.FC<LogoProps> = ({ image, logoText, size = 40 }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      {image}
    </Box>

    {logoText && (
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {logoText}
      </Typography>
    )}
  </Box>
);

export const AppBar: React.FC<AppBarProps> = ({ logo }) => {
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
        <Logo {...logo} />
      </Toolbar>
    </MUIAppBar>
  );
};
