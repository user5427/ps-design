import { AppBarData } from "@/constants";
import { Box, AppBar as MUIAppBar, Toolbar, Typography } from "@mui/material";
import type React from "react";

interface LogoProps {
  logo: React.ReactNode;
  logoText?: string;
  size?: number;
}

export interface AppBarProps extends LogoProps {}

const Logo: React.FC<LogoProps> = ({ logo, logoText, size = AppBarData.size }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      {logo}
    </Box>

    {logoText && (
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {logoText}
      </Typography>
    )}
  </Box>
);

export const AppBar: React.FC<AppBarProps> = ({ logo, logoText }) => {
  if (!logo) return null;

  return (
    <MUIAppBar
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 ,
        color: "text.primary",
        bgcolor: "background.paper",}}
        component="header"
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Logo logo={logo} logoText={logoText} />
      </Toolbar>
    </MUIAppBar>
  );
};
