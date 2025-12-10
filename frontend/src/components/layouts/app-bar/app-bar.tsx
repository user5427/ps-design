import { Box, AppBar as MUIAppBar, Toolbar, Typography } from "@mui/material";
import type React from "react";

type Logo = {
  image: React.ReactNode;
  text: string;
  size: number;
};

interface LogoProps {
  logo: Logo;
}

export interface AppBarProps extends LogoProps {}

const Logo: React.FC<LogoProps> = ({ logo }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Box
      sx={{
        width: logo.size,
        height: logo.size,
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

export const AppBar: React.FC<AppBarProps> = ({ logo }) => {
  return (
    <MUIAppBar
      position="static"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        color: "text.primary",
        bgcolor: "background.paper",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Logo logo={logo} />
      </Toolbar>
    </MUIAppBar>
  );
};
